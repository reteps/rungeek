const express = require('express')
const axios = require('axios')
const parser = require('node-html-parser');

const { School, Athlete, ResultGrid } = require('./lib')
let backend = express()
backend.use(express.json())
backend.get('/', (req, res) => {
    res.send('Success.')
})
const catchAsync = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(err => next(err))
    }
}
backend.all('/div/:id', catchAsync(async (req, res, next) => {
    const url = `https://www.athletic.net/api/v1/SiteHeader/GetDivChildren?sport=xc&divId=${req.params.id}`
    axios.get(url).then(r => res.send(r.data))
}))

backend.all('/team/:id', catchAsync(async (req, res, next) => {
    let options = { sport: 'CrossCountry' }
    if (req.body) {
        options = Object.assign(options, req.body)
    }
    const url = `https://www.athletic.net/${options.sport}/School.aspx?SchoolID=${req.params.id}`
    axios.get(url).then(d => {
        let params = /anetSiteAppParams = (.*);/g.exec(d.data)
        let teamData = JSON.parse(params[1])
        if (!('teamHeader' in teamData)) {
            throw new MyError(`Could not find team with ID ${req.params.id}`, 429)
        }
        res.send(teamData)
    }).catch(err => next(err))
}))

backend.all('/grid/:id/:year', catchAsync(async (req, res, next) => {
    let options = { gender: 'M', filter: true, type: 'dateMatrix' }
    if (req.body) {
        options = Object.assign(options, req.body)
    }
    console.log(options)
    const url = `https://www.athletic.net/CrossCountry/Results/Season.aspx?SchoolID=${req.params.id}&S=${req.params.year}`
    console.log(url)
    axios.get(url).then(r => {
        return parser.parse(r.data)
    }).then(html => {
        const lookupTable = html.querySelector('table.pull-right-sm')
        const resultTable = html.querySelector(`#${options.gender}_Table`)
        let resultGrid = ResultGrid.fromHTML(lookupTable, resultTable, req.params.year)[options.type](options.filter)
        res.send(resultGrid)
    })
    .catch(next)
}))
backend.all('/search/:query', catchAsync(async (req, res, next) => {
    if (req.params.query.length < 3) {
        throw new MyError('Invalid length!!', 400)
    }
    let options = { 'fq': '', 'q': req.params.query, start: 0 }
    if (req.body) {
        options = Object.assign(options, req.body)
    }
    console.log(`Got ${req.params.query} & options ${JSON.stringify(options)}`)
    axios.post('https://www.athletic.net/Search.aspx/runSearch', options).then(resp => {
        // return next(new MyError('Is this caught? length!!', 401))
        let html = resp.data.d.results
        
        const root = parser.parse(html)
        var isSchool = options.fq == 't:t'
        if (options.fq === 't:m') {
            // TODO: implement meets
            return []
        }
        let results = root.querySelectorAll("tr").map(item => {
            // Individially test
            if (options.fq === '') {
                if (item.querySelector('i.fa-calendar-alt') !== null) {
                    return
                }
                isSchool = /School/.test(item.childNodes[1].childNodes[0].getAttribute('href'))
            }
            return isSchool ? School.fromNode(item) : Athlete.fromNode(item)
        }).filter(a => a !== null)

        res.json(results)
    }).catch(err => {
        next(err)
    })
}))

// Error Handling


backend.all('*', (req, res, next) => {
    next(new MyError(`Can't find ${req.originalUrl} on this server!`, 404))
})

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    })
}

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        })

    // Programming or other unknown error
    } else {
        // 1) Log error
        console.error('ERROR 💥: ', err)

        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        })
    }
}

class MyError extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = true
        Error.captureStackTrace(this, this.constructor) 
    }
}
backend.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res)
    } else if (process.env.NODE_ENV === 'production') {
        sendErrorProd(err, res)
    }
})
module.exports = backend
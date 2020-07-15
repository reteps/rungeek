"use strict"
let axios = require('axios')
class Athlete {
    name
    gender
    id
    school
    xc
    tf
    type = 'athlete'
    constructor(data) {
        Object.assign(this, data)
    }
    static fromNode(item) {
        try {

            let gender = item.childNodes[0].childNodes[0].getAttribute('alt').toLowerCase()
            let link = item.querySelector("a.result-title-tf") || item.querySelector('a.result-title-xc')
            let name = link.childNodes[0].rawText
            let id = link.getAttribute('href').split('=')[1]
            let school = item.querySelector('div.small').querySelector('a').getAttribute('href').split('=')[1]
            let xc = item.querySelector('span.XC') !== null
            let tf = item.querySelector('span.TF') !== null
            return new Athlete({name, gender, id, xc, tf, school})
        } catch (err) {
            console.log('Skipping an athlete because of an error....')
            return null
        }
    }
    async init() {

    }
}
class Division {
    sport
    id
    name
    constructor(data) {
        Object.assign(this, data)
    }
    static fromNode(d) {
        let link = d.getAttribute('href')
        return new Division({name: d.rawText, sport: link.split('/')[0], id: link.split('=')[1]})
    }
    static fromJSON({title: name, id, url}) {
        return new Division({name, id, sport: url.split('/')[1]})
    }
}
class ResultGrid {
    lookupTable
    dates
    results
    year
    constructor(data) {
        Object.assign(this, data)
    }

    static fromHTML(lookupHTML, dataTable, year) {
        // Generate lookup table
        let lookupTable = {}
        const empty = {rawText: null}
        lookupHTML.querySelectorAll('td').forEach(td => {
            let tag = td.childNodes[0].rawText
            let race = td.childNodes[1].rawText
            lookupTable[tag] = race
        })
        let dates = dataTable.querySelector('tr').querySelectorAll('th').slice(2).map(th => th.rawText)
        let results = {}
        dataTable.querySelector('tbody.athletes').querySelectorAll('tr').forEach(row => {
            let cols = row.querySelectorAll('td')
            const grade = cols[0].rawText
            const name = cols[1].rawText
            let times = cols.slice(2).map((node, i) => {
                const event = lookupTable[(node.querySelector('span') || empty).rawText]
                return new RaceResult({ grade, name, date: dates[i], i, time: node.rawText === ' ' ? null : node.rawText, event })
            })
            results[name] = times
        })
        return new ResultGrid({year, lookupTable, dates, results })
    }

    athleteMatrix(filter = false) {
        return Object.values(this.results).map(a => a.filter(t => !filter || t.time !== null))
    }
    dateMatrix(filter = false) {
        let matrix = Object.values(this.results)
        return matrix[0].map((_, i) => matrix.map(athlete => athlete[i]).filter(t => !filter || t.time !== null))
    }
    flattened(filter = false) {
        return Object.values(this.results).flatMap(v => v).filter(t => !filter || t.time !== null)
    }
}
class RaceResult {
    date
    year
    time
    event
    grade
    name
    i = -1
    constructor(data) {
        Object.assign(this, data)
    }

    jsDate() {

    }

    jsTime() {
        
    }
}
class School {
    name
    id
    xc = true
    tf = true
    divs
    type = 'school'
    constructor({ divs, ...data }) {
        Object.assign(this, data)
        this.divs = divs ? divs.map(d => new Division(d)) : null
    }
    static fromNode(item) {
        let link = item.querySelector("a.result-title-tf") || item.querySelector('a.result-title-xc')

        let name = link.childNodes[0].rawText
        let id = link.getAttribute('href').split('=')[1]
        let divisionLinks = item.querySelector('div.small').querySelectorAll('a').slice(1)
        let divs = divisionLinks.map(d => Division.fromNode(d))
        let xc = item.querySelector('span.XC') !== null
        let tf = item.querySelector('span.TF') !== null
        return new School({name, id, xc, tf, divs})
    }
    static fromJSON({ tree }) {
        let divs = tree.slice(1, tree.length - 1).map(d => Division.fromJSON(d))
        let {title:name, id} = tree[tree.length - 1]
        console.log(divs)
        console.log(name, id)
        return new School({name, id, divs})
    }
    // Initialize school
    async init() {

    }
}
module.exports = { Athlete, Division, School, ResultGrid }
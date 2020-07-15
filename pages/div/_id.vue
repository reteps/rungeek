<template>
    <div>
        <v-btn @click="testSubteams"> Load all teams in this division </v-btn>
        <v-progress-circular v-if="status == 'preload'" indeterminate></v-progress-circular>
        <v-btn v-if="status == 'loaded'"> Fetch a</v-btn>
    </div>
</template>
<script>
let CanvasJS = null;
if (process.client) {
    CanvasJS = require('~/assets/canvasjs.min.js')
}
export default {
    name: 'DivPage',
    data() {
        return {
            status: 'preload',
            teams: [],
        }
    },
    async asyncData(ctx) {
        return { 
            id: ctx.params.id
        }
    },
    methods: {
        async getSubteams(id) {
            let vm = this
            return await this.$axios.get(`/api/div/${id}`).then(async r => {
                let additionalTeams = await Promise.all(r.data.divInfo.map(subDivision => {
                    return vm.getSubteams(subDivision.DivIDDivision)
                }))
                let teamList = r.data.teams.concat(...additionalTeams)
                return teamList
            })
        },
        async testSubteams() {
            this.status = 'loading'
            this.teams = await this.getSubteams(this.id)
            this.status = 'loaded'
        }
    }
}
</script>

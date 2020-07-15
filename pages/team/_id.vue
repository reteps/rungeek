<template>
    <div>
    <p> Welcome to the team page for {{ team.name }} </p>
    <p> Select a division you fool</p>
    <ul>
        <li v-for="div in team.divs"> <a :href='`/div/${div.id}`'>{{ div.name }} </a></li>
    </ul>
    </div>
</template>
<script>
const { School } = require('~/api/lib.js')
export default {
    name: 'TeamPage',
    async asyncData(ctx) {
        return { 
            team: await ctx.$axios.get(`/api/team/${ctx.params.id}`).then(t => {
                return School.fromJSON(t.data)
            })
        }
    }
}
</script>

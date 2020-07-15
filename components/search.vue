<template>
    <div>
    <v-row align="center">
        <v-form ref="form" v-model="valid">
            <v-text-field v-model="text" :rules="rules" label="Search"></v-text-field>
            <v-btn :disabled="!valid" @click="search"> Submit </v-btn>
        </v-form>
    </v-row>
    <v-row>
        <v-list-item-group>
            <v-list-item :key='i' v-for="(item,i) in results">
                <v-list-item-content>
                    <v-list-item-title><a :href="`/team/${item.id}`">{{ item.name }}</a></v-list-item-title>
                </v-list-item-content>
            </v-list-item>
        </v-list-item-group>
    </v-row>
    </div>
</template>
<script>
const { School } = require('~/api/lib.js')
export default {
    name: 'SearchBar',
    data() {
        return {
            text: '',
            valid: true,
            rules: [
                t => t.length >= 3 || 'Keep typing...'
            ],
            results: []
        }
    },
    methods: {
        search() {
            let vm = this;
            this.$axios.post(`/api/search/${this.text}/`, {'fq': 't:t'}).then(res => 
                vm.results = res.data.map(a => {
                    return new School(a)
                })
            )
        }
    }
}
</script>
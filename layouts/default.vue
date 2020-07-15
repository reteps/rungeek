<template>
  <v-app dark>
    <v-app-bar
      fixed
      app
    >
      <v-toolbar-title v-text="title" />
      <v-spacer />
      <v-btn :href="item.to" v-for="item in items" text>
        <v-icon> {{ item.icon }} </v-icon>
        {{ item.title }}
      </v-btn>
    </v-app-bar>
    <v-main>
      <v-container>
        <nuxt />
      </v-container>
    </v-main>
    <v-footer
      absolute
      app
    >
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  data () {
    return {
      items: [
        {
          icon: 'fa fa-house',
          title: 'Welcome',
          to: '/'
        },
        {
          icon: '',
          title: 'API Test',
          to: '/api/search/peter'
        }
      ],
      title: 'Rungeek 🤓'
    }
  }
}
</script>

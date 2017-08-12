<template>
  <div id="app">
    <img src="./assets/logo.png">
    <div style="width: 600px; height: 400px">
      <wordcloud
      nameKey="skill"
      valueKey="value">
      </wordcloud>
    </div>

  </div>
</template>

<script>
import wordcloud from './components/WordCloud.vue'
export default {
  name: 'app',
  components: {
    wordcloud
  },
  data () {
    return {
    }
  }
}
</script>

<style lang="scss">
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  margin-top: 60px;
}

</style>

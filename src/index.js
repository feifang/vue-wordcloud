import wordcloud from './components/WordCloud.vue'
export default wordcloud
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.component('word-cloud', wordcloud)
}

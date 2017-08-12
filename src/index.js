import WordCloud from './components/WordCloud.vue'

export default WordCloud

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.component('word-cloud', WordCloud)
}

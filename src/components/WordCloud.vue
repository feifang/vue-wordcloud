<template>
  <div class="wordCloud" v-resize="onResize"></div>
</template>

<script>
import * as d3 from 'd3'
import * as cloud from 'd3-cloud'
import * as d3ScaleChromatic from 'd3-scale-chromatic'
import resize from 'vue-resize-directive'

function throttle (method, context) {
  clearTimeout(method.tid)
  method.tid = setTimeout(function () {
    method.call(context)
  }, 200)
}

const directives = {
  resize
}
const props = {
  margin: {
    type: Object,
    default: function () {
      return {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
      }
    }
  },
  wordPadding: {
    type: Number,
    default: 3
  },
  rotate: {
    type: Object,
    default: function () {
      return {
        from: -60,
        to: 60,
        numOfOrientation: 5
      }
    }
  },
  spiral: { //  two built-in spirals: "archimedean" and "rectangular"
    type: String,
    default: 'archimedean'
  },
  fontScale: {
    type: String,
    default: 'sqrt'
  },
  font: {
    type: String,
    default: 'impact'
  },
  fontSize: {
    type: Array,
    default: function () {
      return [10, 80]
    }
  },
  color: {
    type: [String, Array], // using d3 color schemes or self defined colors
    default: 'Category10'
  },
  data: {
    type: Array,
    required: true
  },
  nameKey: {
    type: String,
    default: 'name'
  },
  valueKey: {
    type: String,
    default: 'value'
  },
  showTooltip: {
    type: Boolean,
    default: true
  },
  wordClick: {
    type: Function,
    default: null
  }
}

export default {
  name: 'word-cloud',
  directives,
  props,
  data () {
    return {
      svgWidth: 0,
      svgHeight: 0
    }
  },
  computed: {
    size () {
      const { svgWidth, svgHeight } = this
      const { margin } = this
      const width = svgWidth - margin.left - margin.right
      const height = svgHeight - margin.top - margin.bottom
      return { width, height }
    },
    words () { // sort data in desc order, so as to get the right fontScale
      const { data, valueKey } = this
      const words = data.sort(function (a, b) {
        return parseFloat(b[valueKey]) - parseFloat(a[valueKey])
      })
      return words
    }
  },
  mounted () {
    this.getSize()
    this.chart = this.createChart()
    this.renderChart()
  },
  watch: {
    words: {
      handler: function (val, oldVal) {
        this.update()
      },
      deep: true
    }
  },
  methods: {
    onResize () {
      this.getSize()
      throttle(this.update)
    },
    getSize () {
      this.svgWidth = this.$el.clientWidth
      this.svgHeight = this.$el.clientHeight
    },
    createSvg () {
      const svg = d3.select(this.$el).append('svg')
                      .attr('width', '100%')
                      .attr('height', '100%')
      return svg
    },
    createChart () {
      const { margin } = this
      const { width, height } = this.size
      const svg = this.createSvg()
      const chart = svg.append('g')
                         .attr('width', width)
                         .attr('height', height)
                         .attr('class', 'chart')
                         .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      return chart
    },
    getRotation () {
      const { from: x1, to: x2, numOfOrientation: n } = this.rotate
      const multiplier = ((Math.abs(x1) + Math.abs(x2)) / (n - 1)) || 1
      return { a: n, b: (x1 / multiplier), c: multiplier }
    },
    getColorScale(color) {
      if (typeof color === 'string') { // d3 color schemes
        return d3.scaleOrdinal(d3ScaleChromatic['scheme' + color])
      } else {
        return d3.scaleOrdinal(color) // self defined color list
      }
    },
    setFontSizeScale () {
      const { fontSize, fontScale, words, valueKey } = this
      switch (fontScale) {
        case 'sqrt':
          this.fontSizeScale = d3.scaleSqrt()
          break
        case 'log':
          this.fontSizeScale = d3.scaleLog()
          break
        case 'n':
          this.fontSizeScale = d3.scaleLinear()
          break
        default:
      }
      this.fontSizeScale.range(fontSize)
      if (words.length) {
        this.fontSizeScale.domain([+words[words.length - 1][valueKey] || 1, +words[0][valueKey]])
      }
    },
    renderChart () {
      this.setFontSizeScale()
      const { spiral, wordPadding, fontSizeScale, font, words, nameKey, valueKey } = this
      const { width, height } = this.size
      const { a, b, c } = this.getRotation()
      const layout = cloud()
              .size([width, height])
              .words(words)
              .fontSize(d => fontSizeScale(d[valueKey]))
              .text(d => d[nameKey])
              .font(font)
              .padding(wordPadding)
              .rotate(() => { return (~~(Math.random() * a) + b) * c })
              .spiral(spiral)
              .on('end', this.draw)
      this.layout = layout
      layout.start()
    },
    draw (data) {
      const { layout, chart, color, nameKey, valueKey, showTooltip, wordClick } = this
      const fill = this.getColorScale(color)
      const vm = this
      const centeredChart = chart.append('g')
              .attr('transform', 'translate(' + layout.size()[0] / 2 + ',' + layout.size()[1] / 2 + ')')
      // Define the div for the tooltip
      const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
      const text = centeredChart.selectAll('text')
              .data(data)
           .enter().append('text')
              .style('font-size', d => d.size + 'px')
              .style('font-family', d => d.font)
              .style('fill', (d, i) => fill(i))
              .attr('class', 'text')
              .attr('text-anchor', 'middle')
      text.transition()
              .duration(500)
              .attr('transform', (d) => { return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')' })
              .text(d => d.text)
      if (showTooltip) {
        text.on("mouseover", function(d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .7)
                tooltip.html(nameKey + ': ' + d[nameKey] + "<br/>"  + valueKey + ': ' + d[valueKey])
            })
            .on("mousemove", function(d) {
                tooltip
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 40) + "px")
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0)
        });
      }
      text.on('click', (d) => {
        wordClick(d[nameKey], d[valueKey], vm)
      })
    },
    update () {
      const { words, layout, fontSizeScale, chart, valueKey } = this
      const { width, height } = this.size
      if (words.length) {
        fontSizeScale.domain([+words[words.length - 1][valueKey] || 1, +words[0][valueKey]])
      }
      // clear chart
      chart.select('g').remove()
      layout.stop().size([width, height]).words(words).start()
    }
  }
}
</script>


<style scope>
.wordCloud {
  display: inline-block;
  position: relative;
  width: 100%;
  height: 400px;
}
.wordCloud svg {
  display: inline-block;
  position: absolute;
  top: 0;
  left: 0;
}
div.tooltip {
    position: absolute;
    width: 140px;
    height: 50px;
    padding: 8px;
    font: 18px Arial;
    line-height: 24px;
    color: white;
    background: black;
    border: 0px;
    border-radius: 2px;
    pointer-events: none;
}
</style>

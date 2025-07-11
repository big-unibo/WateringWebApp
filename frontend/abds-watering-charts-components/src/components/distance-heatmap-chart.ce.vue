<script setup>
import {nextTick, ref, watch, watchEffect} from "vue";
import {CommunicationService} from "../services/CommunicationService.js";
import VueApexCharts  from "vue3-apexcharts"

const communicationService = new CommunicationService();
const heatmapSeries = ref([]);
const chartOptions = ref({emitsOptions: false})
const image = ref(null)
const container = ref(null)
const rDistance = ref(null)

const props = defineProps(['config', 'selectedTimestamp'])
const showChart = ref(false)
const loadingFlag = ref(false)
const endpoint = 'getDistanceFromOptimalState'

watchEffect( async () => {
  let value = props.config;
  if(value) {
    await mountChart()
  }
});

const buildHeatmapSeries = (valueKey) => {
  let x = []
  const series = Array.from(image.value.reduce((accumulator, currentValue) => {
    if (!accumulator.has(currentValue.yy))
      accumulator.set(currentValue.yy, []);
    accumulator.get(currentValue.yy).push({ x: currentValue.xx,
      value: currentValue[valueKey].toFixed(2)
    })
    return accumulator
  }, new Map()), ([key, value])=> {
    if(x.length === 0){
      x = value.map(e => e.x).sort((a,b)=>parseInt(a)-parseInt(b))
    }
    return {
      name: key, 
      data: value.sort((a,b) => a.x - b.x).map(e => e.value)
    }
  }).sort((a,b)=> b.name - a.name)

  return [x, series]
}

async function drawImage(){
  if (!image.value){
    return
  } 

  const [xValues, series] = buildHeatmapSeries("value")

  const dripperSeries = {
    name: "0",
    data: new Array(series[0].data.length).fill(0)
  }

  //series.push(dripperSeries)

  heatmapSeries.value = series
  if(!container.value){
    await nextTick()
  }

  const containerWidth = container.value.offsetWidth

  let cellSize
  if(heatmapSeries.value[0].data.length > heatmapSeries.value.length){
    cellSize = containerWidth / heatmapSeries.value[0].data.length
  } else {
    cellSize = containerWidth / heatmapSeries.value.length * 0.9
  }

  cellSize = Math.min(cellSize, 32)

  const verticalOffset = 25
  const horizontalOffset = 10
  const chartHeight = (cellSize * heatmapSeries.value.length + verticalOffset) 
  const chartWidth = (cellSize * heatmapSeries.value[0].data.length + horizontalOffset)

  chartOptions.value = {
    chart: {
      offsetX: (containerWidth - chartWidth)/2,
      type: 'heatmap',
      height: (chartHeight + "px"),
      width: (chartWidth + "px"),
      toolbar: {
        offsetX: chartWidth < containerWidth * 0.75 ? containerWidth * 0.3 : 0,
        show: true
      },
      zoom: {
        enabled: false,
      }
    },
    plotOptions: {
      heatmap: {
        enableShades: false,
        radius: 0,
        colorScale: {
          ranges: [
            { from: -20, to: -1.9, color: '#053061', name: 'Very Low' },
            { from: -1.9, to: -1.7, color: '#1b4c7c', name: 'Low' },
            { from: -1.7, to: -1.5, color: '#256795', name: 'Below Average' },
            { from: -1.5, to: -1.3, color: '#3081af', name: 'Slightly Below Average' },
            { from: -1.3, to: -1.1, color: '#3b9cc9', name: 'Moderate Below Average' },
            { from: -1.1, to: -0.9, color: '#46b7e3', name: 'Minor Below Average' },
            { from: -0.9, to: -0.7, color: '#51d1fd', name: 'Low Average' },
            { from: -0.7, to: -0.5, color: '#b4d9fc', name: 'Near Average' },
            { from: -0.5, to: -0.3, color: '#cde6f6', name: 'Slightly Near Average' },
            { from: -0.3, to: -0.1, color: '#e6f3f0', name: 'Near Neutral' },
            { from: -0.1, to: 0.1, color: '#ffffff', name: 'Neutral' },
            { from: 0.1, to: 0.3, color: '#fff1e6', name: 'Near Neutral' },
            { from: 0.3, to: 0.5, color: '#ffd1d1', name: 'Slightly Near Average' },
            { from: 0.5, to: 0.7, color: '#ffb0b0', name: 'Near Average' },
            { from: 0.7, to: 0.9, color: '#ff8f8f', name: 'Low Average' },
            { from: 0.9, to: 1.1, color: '#ff6e6e', name: 'Minor Above Average' },
            { from: 1.1, to: 1.3, color: '#ff4d4d', name: 'Moderate Above Average' },
            { from: 1.3, to: 1.5, color: '#ff2c2c', name: 'Slightly Above Average' },
            { from: 1.5, to: 1.7, color: '#ff0b0b', name: 'Above Average' },
            { from: 1.7, to: 1.9, color: '#cc0000', name: 'High' },
            { from: 1.9, to: 20, color: '#8c0000', name: 'Very High' },
          ],
        }
      },
    },
    legend: {
        show: false,
    },
    dataLabels: {
      formatter: function(value, { seriesIndex, dataPointIndex, w }) { 
        if (value == 0){
          return ""
        } else {
          return value
        }
      },
      enabled: cellSize > 20,
      style: {
        fontSize: '10px',
        colors: ["#888888"]
      },

    },
    stroke: {
      width: 0
    },
    title: {
      text: 'Distanze dai valori ottimi',
      align: 'center',
      offsetY: 10,
    },
    xaxis: {
      type: 'category',
      categories: xValues,
      tooltip: {
          enabled: false,
      },
      tickPlacement: 'on',
      labels: {
        show: true
      }
    },
    yaxis: {
      axisTicks: {
        show: true,
      },
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    tooltip:{
      custom: function({series, seriesIndex, dataPointIndex, w}) {
        let value = series[seriesIndex][dataPointIndex]
        if (value !== 0) {
          return ('<div class="arrow_box m-1">' +
            '<div> <strong>val</strong>: ' + value + '</div>' +
            '<div> <strong>x</strong>: ' + xValues[dataPointIndex] + '</div>' +
            '<div> <strong>y</strong>: ' + heatmapSeries.value[seriesIndex].name + '</div>' +
            '</div>')
        } else 
          return ""

      }
    }
  }
}

async function mountChart() {
  const parsed = JSON.parse(props.config);
  const selectedTimestamp = props.selectedTimestamp
  const params = {...parsed.params}
  params["timestamp"] = props.selectedTimestamp
  showChart.value = false
  loadingFlag.value = true
  const chartDataResponse = await communicationService.getChartData(parsed.environment, parsed.paths, params, endpoint, 'measures')
  if(JSON.stringify(parsed) !== props.config || selectedTimestamp !== props.selectedTimestamp){
      return
  }
  if(chartDataResponse) {
    showChart.value = chartDataResponse.length > 0
    if(showChart.value){
        image.value = chartDataResponse
        rDistance.value = (chartDataResponse.map(item => item.value).reduce((a,b) => a + b, 0)/chartDataResponse.map(item => item.weight).reduce((a,b) => a + b, 0)).toFixed(2)
        await drawImage()
    }
  } else {
    showChart.value = false
  }
  loadingFlag.value = false
}

watch( () => props.selectedTimestamp, async () => {
  await mountChart()
}) 
</script>

<template>
  <div class="text-center px-2 p-1 m-1 mx-auto">
    <div>Distanza dall'ottimo (r): {{ rDistance }}</div>
  </div> 
  <div v-if="showChart" ref="container">
    <VueApexCharts type="heatmap" :options="chartOptions" :series="heatmapSeries"></VueApexCharts>
  </div>
  <div v-else-if="loadingFlag" class="d-flex justify-content-center align-items-center">
    <div class="spinner-border" role="status">
      <span class="sr-only">Caricamento...</span>
    </div>
  </div>
</template>

<style>
@import '../assets/main.css';
</style>
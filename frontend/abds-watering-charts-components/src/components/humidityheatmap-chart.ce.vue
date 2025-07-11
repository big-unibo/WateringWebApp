<script setup>
import {nextTick, ref, watch, watchEffect} from "vue";
import {CommunicationService} from "../services/CommunicationService.js";
import VueApexCharts  from "vue3-apexcharts"
import { luxonDateTimeToString } from "../common/dateUtils.js"

const communicationService = new CommunicationService();
const heatmapSeries = ref([]);
const chartOptions = ref({emitsOptions: false})
const images = ref(new Map())
const container = ref(null)

const props = defineProps(['config', 'selectedTimestamp'])
const showChart = ref(false)
const loadingFlag = ref(false)
const endpoint = 'heatmap'

watchEffect( async () => {
  let value = props.config;
  if(value) {
    await mountChart()
  }
});

watch( () => props.selectedTimestamp, async (timestamp) => {
  if(timestamp){
    await drawImage(timestamp)
  }
})

async function drawImage(timestamp){
  if (!(Object.keys(images.value).length == 0)){
    return
  }
  timestamp = String(timestamp)
  if(!images.value.has(timestamp)){
    console.log("Image " + timestamp + " is missing")
    return
  }
 
  const parsed = JSON.parse(props.config);
  const dripperPos = await communicationService.getFieldInfo(parsed.environment, parsed.paths, {timestamp: timestamp}, "dripperInfo")
  if(JSON.stringify(parsed) !== props.config){
      return
  }

  const image = images.value.get(timestamp)
  let xValues = []
  const series = Array.from(image.reduce((accumulator, currentValue) => {
    if (!accumulator.has(currentValue.yy))
      accumulator.set(currentValue.yy, []);
      accumulator.get(currentValue.yy).push({ x: currentValue.xx,
      value: currentValue.value.toFixed(2)
    })
    return accumulator
  }, new Map()), ([key, value])=> {
    if(xValues.length === 0){
      xValues = value.map(e=>e.x)
    }
    return {
      name: key,
      data: value.sort((a,b)=> a.x - b.x).map(e => e.value)
    }
  }).sort((a,b)=> b.name - a.name)


  const dripperSeries = {
    name: "0",
    data: new Array(series[0].data.length).fill(1)
  }

  dripperSeries.data[xValues.indexOf(dripperPos.xx)] = 0

  series.push(dripperSeries)

  heatmapSeries.value = series
  if(!container.value){
    return
  }

  const containerWidth = container.value.offsetWidth

  let cellSize
  if(heatmapSeries.value[0].data.length > heatmapSeries.value.length){
    cellSize = containerWidth / heatmapSeries.value[0].data.length
  } else {
    cellSize = containerWidth / heatmapSeries.value.length * 0.9
  }

  cellSize = Math.min(cellSize, 32)

  const verticalOffset = 60
  const horizontalOffset = 10
  const chartHeight = (cellSize * Math.max(heatmapSeries.value.length,7) + verticalOffset) 
  const chartWidth = (cellSize * Math.max(heatmapSeries.value[0].data.length,7) + horizontalOffset)

  chartOptions.value = {
    chart: {
      type: 'heatmap',
      height: (chartHeight + "px"),
      width: (chartWidth + "px"),
      toolbar: {
        offsetX: chartWidth < containerWidth * 0.75 ? containerWidth * 0.1 : 0,
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
          {
            from: 0.01,
            to: 1000,
            name: " ",
            color: '#ffffff'
          },  
          {
            from: -29.99,
            to: 0,
            name: '(-30,0]',
            color: '#053061'
          },
          {
            from: -99.99,
            to: -30,
            name: '(-100,-30]',
            color: '#337CB7'
          },
          {
            from: -199.99,
            to: -100,
            name: '(-200,-100]',
            color: '#8FC2DD'
          },
          {
            from: -299.99,
            to: -200,
            name: '(-300,-200]',
            color: '#F1A385'
          },
          {
            from: -1499.99,
            to: -300,
            name: '(-1500,-300]',
            color: '#C33D3D'
          },
          {
            from: -2500,
            to: -1500,
            name: '(-∞,-1500]',
            color: '#8C0D25'
          }]
        }
      },
    },
    dataLabels: {
      formatter: function(value, { seriesIndex, dataPointIndex, w }) {
        if (value == 0){
          return "G"
        } else {
          return value.toFixed(0)
        }
      },
      enabled: cellSize > 15,
      style: {
        fontSize: (cellSize > 22 ? '10' : '9') + 'px',
      }
    },
    legend: {
      show: verticalOffset/chartHeight < 0.2,
      markers: {
        width: 5,
        height: 16,
        radius: 0
      }
    },
    stroke: {
      width: 0
    },
    title: {
      text: 'Interpolazione bilineare ' + luxonDateTimeToString(timestamp),
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
        if (value <= 0) {
          if (value == 0) {
            value = "G"
          }
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
  showChart.value = false
  loadingFlag.value = true
  const chartDataResponse = await communicationService.getChartData(parsed.environment, parsed.paths, parsed.params, endpoint, 'values.0.measures')
  if(JSON.stringify(parsed) !== props.config){
      return
  }
  if(chartDataResponse) {
    images.value = new Map(chartDataResponse.map(obj => [obj.timestamp, obj.image]))
    showChart.value = images.value.size > 0
    if (showChart.value){
      const timestamps = Array.from(images.value.keys()).sort()
      if(props.selectedTimestamp){
        await drawImage(props.selectedTimestamp)
      } else {
        await drawImage(timestamps[timestamps.length - 1])
      }
    }
  } else {
    showChart.value = false
  }
  loadingFlag.value = false
}
</script>

<template>
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

.vue-apexcharts {
  display: flex;
  justify-content: center;
  align-items: center;
}

.apexcharts-legend-marker {
  width: 5px !important;
  height: 16px !important;
}

</style>
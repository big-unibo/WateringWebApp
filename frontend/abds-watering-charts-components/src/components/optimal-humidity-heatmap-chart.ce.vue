<script setup>
import {nextTick, ref, watch, watchEffect} from "vue";
import {CommunicationService} from "../services/CommunicationService.js";
import VueApexCharts  from "vue3-apexcharts"
import DistanceChart from "../components/distance-heatmap-chart.ce.vue"

const communicationService = new CommunicationService();
const heatmapSeries = ref([]);
const weightsSeries = ref([])
const optValueChartOptions = ref({emitsOptions: false})
const weightsChartOptions = ref({emitsOptions: false})
const image = ref({})
const containerOptimal = ref(null)

const props = defineProps(['config', 'selectedTimestamp', 'showDistance'])
const showChart = ref(false)
const loadingFlag = ref(false)
const endpoint = 'getOptimalState'

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

async function drawValuesImage(){
  if (!image.value){
    return
  } 
 
  const parsed = JSON.parse(props.config);
  const dripperPos = await communicationService.getFieldInfo(parsed.environment, parsed.paths, {timestamp: props.selectedTimestamp}, "dripperInfo")
  if(JSON.stringify(parsed) !== props.config){
      return
  }

  const [xValues, series] = buildHeatmapSeries("optValue")

  const dripperSeries = {
    name: "0",
    data: new Array(series[0].data.length).fill(1)
  }

  dripperSeries.data[xValues.indexOf(dripperPos.xx)] = 0

  series.push(dripperSeries)

  heatmapSeries.value = series
  if(!containerOptimal.value){
    await nextTick()
  }

  const containerWidth = containerOptimal.value.offsetWidth

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

  optValueChartOptions.value = {
    chart: {
      offsetX: (containerWidth - chartWidth)/2,
      type: 'heatmap',
      height: (chartHeight + "px"),
      width: (chartWidth + "px"),
      toolbar: {
        offsetX: chartWidth < containerWidth * 0.75 ? containerWidth * 0.33 : 0,
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
      show: false,
    },
    stroke: {
      width: 0
    },
    title: {
      text: 'Matrice ottima',
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

async function drawWeightsImage(){
  if (!image.value){
    return
  } 

  const [xValues, series] = buildHeatmapSeries("weight")

  const dripperSeries = {
    name: "0",
    data: new Array(series[0].data.length).fill(0)
  }

  series.push(dripperSeries)

  weightsSeries.value = series
  if(!containerOptimal.value){
    await nextTick()
  }

  const containerWidth = containerOptimal.value.offsetWidth

  let cellSize
  if(weightsSeries.value[0].data.length > weightsSeries.value.length){
    cellSize = containerWidth / weightsSeries.value[0].data.length
  } else {
    cellSize = containerWidth / weightsSeries.value.length * 0.9
  }

  cellSize = Math.min(cellSize, 32)

  const verticalOffset = 25
  const horizontalOffset = 10
  const chartHeight = (cellSize * weightsSeries.value.length + verticalOffset) 
  const chartWidth = (cellSize * weightsSeries.value[0].data.length + horizontalOffset)

  weightsChartOptions.value = {
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
        enableShades: true,
        radius: 0,
      },
    },
    colors: ['#7f7f7f'],
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
        colors: ["#333333"]
      },

    },
    stroke: {
      width: 0
    },
    title: {
      text: 'Maschera dei pesi',
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
        if (value > 0) {
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
  params["timestamp"] = selectedTimestamp
  showChart.value = false
  loadingFlag.value = true
  const chartDataResponse = await communicationService.getChartData(parsed.environment, parsed.paths, params, endpoint, 'optimalState')
  if(JSON.stringify(parsed) !== props.config || selectedTimestamp !== props.selectedTimestamp){
      return
  }
  if(chartDataResponse) {
    showChart.value = chartDataResponse.length > 0
    if(showChart.value){
        image.value = chartDataResponse
        await drawValuesImage()
        await drawWeightsImage()
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
  <div class="row" v-if="showChart">
    <div class="col-lg-6 order-lg-1 order-2 ">
      <div ref="containerOptimal">
        <VueApexCharts type="heatmap" :options="weightsChartOptions" :series="weightsSeries"></VueApexCharts>
      </div>
    </div>
    <div class="col-lg-6 order-lg-2 order-1">
      <div>
        <VueApexCharts type="heatmap" :options="optValueChartOptions" :series="heatmapSeries"></VueApexCharts>
      </div>
    </div>
    <div class="col-8 offset-lg-2">
      <DistanceChart v-if="props.showDistance" :config="props.config" :selectedTimestamp="props.selectedTimestamp"></DistanceChart>
    </div>
  </div>
  <div v-else-if="loadingFlag" class="d-flex justify-content-center align-items-center">
    <div class="spinner-border" role="status">
      <span class="sr-only">Caricamento...</span>
    </div>
  </div>
  <div class="text-center p-3" v-else>
    Nessun ottimo disponibile.
  </div>
</template>

<style>
@import '../assets/main.css';
</style>
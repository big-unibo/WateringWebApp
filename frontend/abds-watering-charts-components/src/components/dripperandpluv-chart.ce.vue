<script setup>

import {Line} from "vue-chartjs";
import {ref, watchEffect} from "vue";
import 'chartjs-adapter-luxon';
import {luxonDateTime} from '../common/dateUtils.js'
import {CommunicationService} from "../services/CommunicationService.js";
import {MultiAxisLineDatasetData} from "../common/MultiAxisLineDatasetData.js";

const communicationService = new CommunicationService();

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale)


const chartData = ref({datasets: [], labels: []})
const options = ref({responsive: true, maintainAspectRatio: false})
const showChart = ref(false)
const loadingFlag = ref(false)

const props = defineProps(['config'])

const endpoint = 'dripperAndPluv'

const groupByType = (measures) => {
  return measures.reduce((accumulator, currentValue) => {
    const key = currentValue.detectedValueTypeDescription
    if (!accumulator.has(key))
      accumulator.set(key, []);
    accumulator.get(key).push(JSON.stringify({
      x: luxonDateTime(currentValue.timestamp),
      y: Number(currentValue.value).toFixed(2)
    }));
    return accumulator;
  }, new Map());
}

function addUnitMeasure(key) {
  if (key === 'Dripper')
    return 'Dripper (L)'
  if (key === 'Pluv Curr')
    return 'Pluv Curr (mm)'
  if (key === 'Sprinkler')
    return 'Sprinkler (L)'
}

const createDatasets = (groupedMeasures) => {
  return Array.from(groupedMeasures, ([key, jsonValues]) => {
    key = addUnitMeasure(key)
    return new MultiAxisLineDatasetData(key, jsonValues, key.includes("(mm)") ? 'y1' : 'y', colorFunction);
  });
};

const colorFunction = (str) => {
  if (str === 'Dripper (L)')
    return '#339CFF'
  if (str === 'Pluv Curr (mm)')
    return '#FFCD3D'
  if (str === 'Sprinkler (L)')
    return '#99ceff'
}

watchEffect(async () => {
  let value = props.config;
  if (value) {
    await mountChart()
  }
});

async function mountChart() {
  const parsed = JSON.parse(props.config);
  let data = []
  showChart.value = false
  loadingFlag.value = true
  const chartDataResponse = await communicationService.getChartData(parsed.environment, parsed.paths, parsed.params, endpoint, 'values.0.measures')
  if(JSON.stringify(parsed) !== props.config){
      return
  }
  if (chartDataResponse) {
    data = chartDataResponse
    showChart.value = data.length > 0
  } else data = []

  const values = data.map(item => item.value);

  const minValue = Math.min(...values);

  const groupByData = groupByType(data);

  const datasets = createDatasets(groupByData).map(bin => bin.getDataSet())

  chartData.value = {
    datasets: datasets
  }

  options.value = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'yyyy-MM-dd HH:mm:ss',
          displayFormats: {
            minute: 'yyyy-MM-dd HH:mm', // Customize the display format for minutes
            second: 'yyyy-MM-dd HH:mm', // Customize the display format for seconds,
            hour: 'yyyy-MM-dd HH:mm:ss',
            day: 'yyyy-MM-dd',
            month: 'yyyy-MM-dd HH:mm:ss'
          },
        },
        ticks: {
          source: 'data'
        },
        title: {
          display: true,
          text: 'Tempo'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'L'
        },
        position: 'left',
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        title: {
          display: true,
          text: 'mm'
        },
      }
    }
  }
  loadingFlag.value = false
}

</script>

<template>
  <pre style="padding-left: 20px; padding-top: 10px;"><b>Pluv Curr</b> espresso in <b>mm</b><br><b>Dripper</b>, <b>Sprinkler</b> espresso in <b>L</b></pre>
  <div class="card-body">
    <div v-if="showChart">
      <Line style="height: 320px;" :data="chartData" :options="options"/>
    </div>
    <div v-else-if="loadingFlag" class="d-flex justify-content-center align-items-center">
      <div class="spinner-border" role="status">
        <span class="sr-only">Caricamento...</span>
      </div>
    </div>
    <div v-else>Nessun dato disponibile.</div>
  </div>
</template>

<style scoped>

</style>
<script setup>

import {Line} from "vue-chartjs";
import {ref, watchEffect} from "vue";
import 'chartjs-adapter-luxon';
import {luxonDateTime} from '../common/dateUtils.js'
import {CommunicationService} from "../services/CommunicationService.js";

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

const props = defineProps(['config'])

const endpoint = 'airTemp'

const chartData = ref({datasets: [], labels: []})
const options = ref({responsive: true, maintainAspectRatio: false})
const showChart = ref(false)
const loadingFlag = ref(false)

const getData = (measures) => {
  return measures.map(measure => ({ x: luxonDateTime(measure.timestamp), y: measure.value }));
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale)

watchEffect(async () => {
  let value = props.config;
  if(value) {
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
  if(chartDataResponse) {
    data = getData(chartDataResponse)
    showChart.value = data.length > 0
  } else data = []

  chartData.value = {
    datasets: [{
      data: data,
      borderColor: '#339CFF',
      backgroundColor: '#339CFF',
      label: "AirTemp"
    }]
  }

  options.value = {
    responsive: true,
    maintainAspectRatio: false,
    parsing: {
      xAxisKey: 'x',
      yAxisKey: 'y'
    },
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
        title: {
          display: true,
          text: '°C'
        }
      }
    }
  }

  loadingFlag.value = false
}

</script>

<template>
  <div v-if="showChart">
    <Line  :data="chartData" :options="options" />
  </div>
  <div v-else-if="loadingFlag" class="d-flex justify-content-center align-items-center">
    <div class="spinner-border" role="status">
      <span class="sr-only">Caricamento...</span>
    </div>
  </div>
  <div v-else>Nessun dato disponibile.</div>

</template>

<style>
@import '../assets/main.css'

</style>
<script setup>

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  TimeScale
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { ref, watchEffect} from "vue";
import 'chartjs-adapter-luxon';
import {luxonDateTime} from '../common/dateUtils.js'
import {CommunicationService} from "../services/CommunicationService.js";
import {BarDatasetData} from "../common/BarDatasetData.js";

const communicationService = new CommunicationService();

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TimeScale)

const chartData = ref({datasets: [], labels: []})
const options = ref({responsive: true, maintainAspectRatio: false})
const showChart = ref(false)
const loadingFlag = ref(false)

const props = defineProps(['config'])

const endpoint = 'waterAggregate'

const totalGroups = ref(null)

const colorFunction = (str) => {
  if (str === 'Dripper (L)')
    return '#339CFFC5'
  if (str === 'Pluv Curr (mm)')
    return '#FFCD3DC5'
  if (str === 'Advice (L)')
    return '#6064C8C5'
  if (str === 'Pot Evap (mm)')
    return '#FA4443C5'
  if (str === 'Expected Water (L)')
    return '#4CAF50C5'
  if (str === 'Sprinkler (L)')
    return '#99ceff'
}

const groupByType = (measures) => {
  return measures.reduce((accumulator, currentValue) => {
    const key = currentValue.detectedValueTypeDescription
    if(!accumulator.has(key))
      accumulator.set(key, []);

    accumulator.get(key).push(JSON.stringify({ x: luxonDateTime(currentValue.timestamp), y: Number(currentValue.value).toFixed(2) }));
    return accumulator;
  }, new Map());
}

const createDatasets = (groupedMeasures) => {
  return Array.from(groupedMeasures, ([key, jsonValues]) => {
    return new BarDatasetData(key, jsonValues, 'y', colorFunction);
  });
};

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
    data = chartDataResponse
    showChart.value = data.length > 0
  } else data = []

  const values = data.map(item => item.value);

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const groupByData = groupByType(data);
  totalGroups.value = new Map(Array(...groupByData.entries()).map(([k,v])=> {
    return [k,v.reduce((a,b)=> a+parseFloat(JSON.parse(b).y),0)]
  }))

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
        display: 'auto',
      }
    },
    legend: {
      onClick: function(e, legendItem) {
        di=legendItem.datasetIndex
        myBarChart.data.datasets[di].hidden = !myBarChart.data.datasets[di].hidden;
        myBarChart.options.scales.yAxes[0].ticks.suggestedMax=getMax(myBarChart)+100;
        myBarChart.update()
      }
    }
  }
  loadingFlag.value = false
}



</script>

<template>
  <pre class="p-2"><b>Advice</b>, <b>Pluv Curr</b>, <b>Pot Evap</b> espressi in <b>mm</b><br><b>Dripper</b>, <b>Sprinkler</b> espresso in <b>L</b></pre>
  <div class="d-flex flex-wrap justify-content-end">
    <div v-for="([group, total]) in totalGroups" :key="group" class="px-2 p-1 m-1 mx-auto" :style="{backgroundColor: colorFunction(group) , borderColor: colorFunction(group), borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid' }">
        <div>Totale {{ group }}: {{ total.toFixed(2) }}</div>
    </div>
  </div>
  <div class="card-body">
    <div v-if="showChart">
      <Bar style="height: 320px;" :data="chartData" :options="options" />
    </div>
    <div v-else-if="loadingFlag" class="d-flex justify-content-center align-items-center">
      <div class="spinner-border" role="status">
        <span class="sr-only">Caricamento...</span>
      </div>
    </div>
    <div v-else>Nessun dato disponibile.</div>
  </div>  
</template>

<style>
@import '../assets/main.css';
</style>
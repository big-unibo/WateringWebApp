<script setup>

import {Line} from "vue-chartjs";
import { ref, watchEffect} from "vue";
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
import {LineDatasetData} from "../common/LineDatasetData.js";
import * as d3 from "d3";

let chartData = ref({datasets: [], labels: []})
let options = ref({responsive: true, maintainAspectRatio: false})
let showChart = ref(false)
const loadingFlag = ref(false)

const props = defineProps(['config','selectedTimestamp'])
const emit = defineEmits(['selectTimestamp'])
const endpoint = 'humidityBins'


const colorFunction = (value) => {
  if (value.includes(", 0]")) {
    return d3.interpolateRdBu(1);
  } else if (value.includes(", -30]")) {
    return d3.interpolateRdBu(0.80);
  } else if (value.includes(", -100]")) {
    return d3.interpolateRdBu(0.70);
  } else if (value.includes(", -200]")) {
    return d3.interpolateRdBu(0.30);
  } else if (value.includes(", -300]")) {
    return d3.interpolateRdBu(0.15);
  } else if (value.includes(", -1500]")) {
    return d3.interpolateRdBu(0.05);
  } else return d3.interpolateRdBu(0)
};

const cleanHumidityBin = (bin) => {
  return bin.split('*')[1].trim();
}

const groupByHumidityBin = (bins) => {
  const totalBinTimestamp = bins.reduce((accumulator,currentValue)=>{
    const key = currentValue.timestamp
    if(!accumulator.has(key))
      accumulator.set(key, 0);
    accumulator.set(key, accumulator.get(key) + parseInt(currentValue.count))
    return accumulator;
  }, new Map());

  return bins.reduce((accumulator, currentValue) => {
    const key = cleanHumidityBin(currentValue.humidityBin);
    if(!accumulator.has(key))
      accumulator.set(key, []);
    accumulator.get(key).push(JSON.stringify({x: luxonDateTime(currentValue.timestamp), y: currentValue.count/totalBinTimestamp.get(currentValue.timestamp)*100}));
    return accumulator;
  }, new Map());
}

const createDatasets = (map) => {
  let index = 0;
  const myArray = Array.from(map, ([key, jsonValues]) => {
    const linedataset = new LineDatasetData(key, jsonValues, 'origin', 0 ,0.3, colorFunction);
    index++
    return linedataset
  });

  return myArray
}

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
    data = chartDataResponse
    showChart.value = data.length > 0
  } else {
    showChart.value = false
  }

  const groupByData = groupByHumidityBin(data);
  emit('selectTimestamp',Math.max(...data.map(e=>e.timestamp),0))

  chartData.value = {
    datasets: createDatasets(groupByData).map(bin => bin.getDataSet())
  }

  options.value = {
    responsive: true,
    maintainAspectRatio: false,
    parsing: {
      xAxisKey: 'x',
      yAxisKey: 'y'
    },
    plugins: {
      filler: {
        propagate: false
      },
      legend: {
        labels: {
          boxWidth: 2
        }
      },
      tooltip: {
        callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(2) + '%'; // Format y-value as percentage
                }
                return label;
              }
            }
      }
    },
    tooltips: {
      mode: 'index',
      intersect: true
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    layout: {
      padding: 20
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
          source: 'auto'
        },
        title: {
          display: true,
          text: 'Tempo'
        }
      },
      y: {
        type: 'linear',
        ticks: {
            callback: function(value, index, values) {
                return value + '%'; // Add percentage sign to y-axis labels
            },
            stepSize: 20,
        },
        stacked: true,
        title: {
          display: true,
          text: '% Celle'
        },
        min: 0,
        max: 100
      }
    },
    onClick: function handleClick(event, array) {
      if (array.length > 0) {
        const timestamp = array[0].element.$context.parsed.x / 1000
        emit('selectTimestamp',timestamp)
      }
    }
  }
  loadingFlag.value = false
}

</script>

<template>
  <div v-if="showChart">
    <Line style="height: 300px" :data="chartData" :options="options" ref="myChart"/>
  </div>
  <div v-else-if="loadingFlag" class="d-flex justify-content-center align-items-center">
    <div class="spinner-border" role="status">
      <span class="sr-only">Caricamento...</span>
    </div>
  </div>
  <div v-else>Nessun dato disponibile.</div>
</template>

<style>
@import '../assets/main.css';
</style>
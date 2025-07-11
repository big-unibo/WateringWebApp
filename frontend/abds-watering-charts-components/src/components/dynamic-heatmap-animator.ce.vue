<script setup>

import '../assets/animator.css'

import {ref, watchEffect} from 'vue';
import GenericLinearChart from "./generic-linechart.ce.vue";
import {CommunicationService} from "../services/CommunicationService.js";
import DynamicHeatmap from "../components/dynamic-heatmap.ce.vue";

const buttonTexts = {
  start: 'Start',
  resume: 'Resume',
  stop: 'Stop'
}

const props = defineProps(['config'])

const animatorConfig = ref(null)

const communicationService = new CommunicationService();
const endpoint = 'humidityBins'

const data = ref([]);
const timestamps = ref(new Set());
const currentTimestamp = ref('');
const currentIndex = ref(0);
const interval = ref(null);
const animationSpeed = ref(300);
const isPlaying = ref(false);
const buttonText = ref(buttonTexts.start);
const currentDate = ref('');

function updateConfig(currentTimestamp, lastTimestamp) {
  const parsedConfigProp = JSON.parse(props.config);
  animatorConfig.value = JSON.stringify({
    environment: parsedConfigProp.environment,
    paths: parsedConfigProp.paths,
    params: {
      timeFilterFrom: (Number(lastTimestamp)+1).toString(),
      timeFilterTo: currentTimestamp.toString()
    }
  })
}

async function calculateTimestampLength() {
  const parsed = JSON.parse(props.config);
  const chartDataResponse = await communicationService.getChartData(parsed.environment, parsed.paths, parsed.params, endpoint, 'values.0.measures')
  if(JSON.stringify(parsed) !== props.config){
      return
  }
  if(chartDataResponse) {
    data.value = chartDataResponse
    timestamps.value = new Set()
  } else {
    data.value = []
  }

  data.value.forEach(d => {
    timestamps.value.add(d.timestamp);
  });
}

function startLoop() {
  interval.value = setInterval(() => {
    const timestampsArray = Array.from(timestamps.value);
    currentTimestamp.value = timestampsArray[currentIndex.value];
    currentIndex.value = (currentIndex.value + 1) % timestampsArray.length;
    currentDate.value = new Date(currentTimestamp.value * 1000).toLocaleDateString('it-IT')
    updateConfig(timestampsArray[currentIndex.value],timestampsArray[Math.max(currentIndex.value - 1,0)])
    if(currentIndex.value + 1 === timestamps.value.size) {
      stopLoop()
      reset()
    }
  }, animationSpeed.value);
}

function stopLoop() {
  clearInterval(interval.value);
  interval.value = null;
  isPlaying.value = false;
}

function reset() {
  clearInterval(interval.value)
  isPlaying.value = false
  interval.value = null
  currentIndex.value = 0
  currentTimestamp.value = ''
  currentDate.value = ''
  buttonText.value = buttonTexts.start
}

function onClickPlayButton() {
  isPlaying.value = !isPlaying.value;
  buttonText.value = isPlaying.value ? buttonTexts.stop : currentIndex.value > 0 ? buttonTexts.resume : buttonTexts.start ;
  isPlaying.value ? startLoop() : stopLoop();
}

function changeAnimationSpeed(value) {
  if (isPlaying.value) {
    stopLoop();
    animationSpeed.value = value;
    buttonText.value = currentIndex.value > 0 ? buttonTexts.resume : buttonTexts.start
  } else {
    animationSpeed.value = value;
  }
}

function selectTimestamp(index) {
  currentIndex.value = index;
  currentTimestamp.value = Array.from(timestamps.value)[currentIndex.value];
  currentDate.value = new Date(currentTimestamp.value * 1000).toLocaleDateString('it-IT');
  stopLoop()
}

function getLeftOffset(dataLen, index) {
  return 100 / (dataLen - 1) * index;
}

watchEffect(async () => {
  var parsedConfig = JSON.parse(props.config)
  await calculateTimestampLength();
  updateConfig(Math.min(...timestamps.value.values()), Math.min(...timestamps.value.values())-1)
});

</script>

<template>
  <div v-if="timestamps.size > 0" class="card">
    <div class="card-body">
      <div class="timeline-placeholder">
        <div class="timeline-wrapper">
          <button id="dynamic-heatmap-play-button" @click="onClickPlayButton">{{ buttonText }}</button>
          <div class="heatmap-timeline">
            <div v-for="(timestamp, index) in Array.from(timestamps)"
                 :key="timestamp"
                 class="time-point"
                 :class="{ 'active': currentIndex === index }"
                 @click="selectTimestamp(index)"
                 :style="{ left: getLeftOffset(timestamps.size, index) + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <div class="charts-wrapper row">
        <div class="heatmap-dataviz col-6">
          <DynamicHeatmap style="margin-left: -10px" :config="animatorConfig" :selectTimestamp="currentTimestamp"></DynamicHeatmap>
        </div>
        <div class="col-1"><p></p></div>
        <div class="line_charts col-5">
          <generic-linear-chart style="height: 200px" :config="animatorConfig" :endpoint="'dripper'" :yTitle="'L'" :label="'Dripper'" :color="'rgb(31, 119, 180)'"></generic-linear-chart>
          <generic-linear-chart style="height: 200px" :config="animatorConfig" :endpoint="'pluv'" :yTitle="'mm'"  :label="'Pluv'" :color="'rgb(31, 119, 180)'"></generic-linear-chart>
        </div>
      </div>

      <div class="row animator-controllers justify-content-end">
        <div class="col-auto">
          <button type="button" class="btn btn-secondary" @click="changeAnimationSpeed(500)">Bassa</button>
        </div>
        <div class="col-auto">
          <button type="button" class="btn btn-secondary" @click="changeAnimationSpeed(300)">Media</button>
        </div>
        <div class="col-auto">
          <button type="button" class="btn btn-secondary" @click="changeAnimationSpeed(100)">Veloce</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    Nessun dato disponibile.
  </div>
</template>

<style>
@import '../assets/main.css';
@import '../assets/animator.css';
</style>
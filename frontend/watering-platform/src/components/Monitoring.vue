<script setup>

import '../assets/basebase.css'

import {computed, onMounted, reactive, ref, watchEffect} from "vue";
import AirTemperatureChart from "../../../abds-watering-charts-components/src/components/airtemperature-chart.ce.vue"
import DripperAndPluvChart from "../../../abds-watering-charts-components/src/components/dripperandpluv-chart.ce.vue"
import WaterAggregateChart from "../../../abds-watering-charts-components/src/components/water-aggregate-chart.ce.vue"
import DeltaChart from "../../../abds-watering-charts-components/src/components/delta-chart.ce.vue"
import CountorMeanChart from "../../../abds-watering-charts-components/src/components/countormean-chart.ce.vue"
import CountorStdChart from "../../../abds-watering-charts-components/src/components/countorstd-chart.ce.vue"
import GroundWaterPotentialChart from "../../../abds-watering-charts-components/src/components/groundwaterpot-chart.ce.vue"
import HumidityHeatmap from "../../../abds-watering-charts-components/src/components/humidityheatmap-chart.ce.vue"
import HumidityMultiLineChart from "../../../abds-watering-charts-components/src/components/humiditymultilinear-chart.ce.vue"
import HumidityDynamicHeatmap from "../../../abds-watering-charts-components/src/components/dynamic-heatmap-animator.ce.vue"
import Calendar from "../../../abds-watering-charts-components/src/components/calendar.vue"
import OptimalHumidityHeatmap from "../../../abds-watering-charts-components/src/components/optimal-humidity-heatmap-chart.ce.vue"
import LogComponent from './LogComponent.vue';
import UpdateOptimalStateComponent from './UpdateOptimalStateComponent.vue';
import {useRouter} from "vue-router";
import authService from '@/services/auth.service';

const router = useRouter()

const props = defineProps(['token', 'user'])

let showCustomizeInput = ref(true)

let selectedTimestampFrom = ref(1719792000)// Example timestamp for 2024-07-01 02:00:00
let selectedTimestampTo = ref(1722463140)// Example timestamp for 2024-07-31 23:59:00

let customSelectedTimestampTo = ref(selectedTimestampTo.value)
let customSelectedTimestampFrom = ref(selectedTimestampFrom.value)


let selectedFieldName = ref("Seleziona un campo")
let selectedThesisName = ref("Seleziona una tesi")
let selectedThesis = ref(null)
let selectedTimeLabel = ref("")
let showDynamicHeatmap = ref(false)
let showOptimalMatrix = ref(false)
let showDetailedWatering = ref(false)
let detailedWateringButton = ref("Mostra puntuale")

const token = reactive(props.token)
const user = reactive(props.user)
const userPermissions = reactive({})

const fields = reactive([])
const thesis = reactive([])
let activeThesis
let connectionParams = {}

onMounted(async () => {
  if(!user) {
    await router.push('/login')
  }
})

watchEffect(async ()=>{
  if(token.value){
    await updateUserPermission()
    if (!selectedThesis.value && fields.value[0]){
      selectField(fields.value[0])
    }
  }
})

function updateConnectionParams() {
  if(selectedThesis.value){
    connectionParams = {
    environment: {
      host: import.meta.env.VITE_BACKEND_ADDRESS,
      token: token.value 
    },
    paths: selectedThesis.value,
    params: {
      timeFilterFrom: selectedTimestampFrom.value,
      timeFilterTo: selectedTimestampTo.value
    }
  }
  }
}

const selectedDateFrom = computed({
  get: () => {
    const timestamp = customSelectedTimestampFrom.value * 1000;
    return new Date(timestamp).toISOString().slice(0, 10);
  },
  set: (newValue) => {
    if(Date.parse(newValue)){
      customSelectedTimestampFrom.value = Date.parse(newValue) / 1000;
    }
  }
});

const selectedDateTo = computed({
  get: () => {
    const timestamp = customSelectedTimestampTo.value * 1000;
    return new Date(timestamp).toISOString().slice(0, 10);
  },
  set: (newValue) => {
    if(Date.parse(newValue)){
      customSelectedTimestampTo.value = Date.parse(newValue) / 1000;
    }
  }
});

function selectTimePeriod(timeFilter) {

  switch (timeFilter) {
    case 'customize_day':
      showCustomizeInput.value = true;
      selectedTimeLabel.value = 'customize_day';
      break;
    case '30_day':
      showCustomizeInput.value = false;
      selectedTimestampFrom.value = getCurrentTimestampMinusDays(30);
      selectedTimestampTo.value = getCurrentTimestampMinusHours(0)
      selectedTimeLabel.value = '30_day';
      break;
    case '7_day':
      showCustomizeInput.value = false;
      selectedTimestampFrom.value = getCurrentTimestampMinusDays(7);
      selectedTimestampTo.value = getCurrentTimestampMinusHours(0)
      selectedTimeLabel.value = '7_day';
      break;
    case '24_hours':
      showCustomizeInput.value = false;
      selectedTimestampFrom.value = getCurrentTimestampMinusHours(24);
      selectedTimestampTo.value = getCurrentTimestampMinusHours(0)
      selectedTimeLabel.value = '24_hours';
      break;
  }

  if(timeFilter != 'customize_day'){
    updateUserPermission()
    updateConnectionParams()
  }
}

function getCurrentTimestampMinusDays(days) {
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - days);
  return Math.floor(currentDate.getTime() / 1000);
}

function getCurrentTimestampMinusHours(hours) {
  let currentDate = new Date();
  currentDate.setHours(currentDate.getHours() - hours);
  return Math.floor(currentDate.getTime() / 1000);
}

function updateCustomTimestamps(){
  selectedTimestampFrom.value = customSelectedTimestampFrom.value
  selectedTimestampTo.value = customSelectedTimestampTo.value
  updateUserPermission()
  updateConnectionParams()
}

function selectItem(item) {
  selectedThesisName = createThesisName(item)
  selectedThesis.value = item
  updateConnectionParams()
}

function selectField(field){
  selectedFieldName.value = createFieldName(field)
  thesis.value = activeThesis.get(JSON.stringify(field))
  selectedThesis.value = thesis.value[0]
  selectItem(selectedThesis.value)
}

function createFieldName(item) {
  if(!item) return ''
  return `${item.refStructureName}; ${item.companyName}; ${item.fieldName}`
}

function createThesisName(item){
  if(!item) return ''
  return `Settore ${item.sectorName}; Tesi ${item.plantRow}; ${item.colture}; ${item.coltureType}`
}

function isLabelSelected(value) {
  return selectedTimeLabel.value === value
}

async function updateUserPermission(){
  if (token.value){
    userPermissions.value = await authService.retrieveUserFieldPermissions(token.value, selectedTimestampFrom.value, selectedTimestampTo.value)
    activeThesis = userPermissions.value.permissions.reduce((accumulator, currentValue)=>{
      const field = JSON.stringify({
        refStructureName: currentValue.refStructureName,
        companyName: currentValue.companyName,
        fieldName: currentValue.fieldName
      })
      if (!accumulator.has(field)){
        accumulator.set(field,[])
      }
      accumulator.get(field).push(currentValue)
      return accumulator
    }, new Map())
    
    fields.value = Array(...activeThesis.keys()).map(f => JSON.parse(f))
  }
}

function hasUserPermission(permission) {
  if(userPermissions && userPermissions.value && userPermissions.value.permissions) {
    if(!selectedThesis.value || Object.keys(selectedThesis.value).length === 0) return false;
    if(userPermissions.value.role === 'admin') return true
    const keySelected = createFieldName(selectedThesis.value)+ createThesisName(selectedThesis.value)
    for(const field of userPermissions.value.permissions) {
      const tmpKey = createFieldName(field)+ createThesisName(field)
      if(keySelected === tmpKey) {
        return field.permissions.includes(permission)
      }
    }
  }
  return false
}

function enableDynamicHeatmap() {
  showDynamicHeatmap.value = !showDynamicHeatmap.value
}

function enableOptimalMatrix() {
  showOptimalMatrix.value = !showOptimalMatrix.value
}

function enableDetailedAggregate() {
  showDetailedWatering.value = !showDetailedWatering.value
  detailedWateringButton.value = showDetailedWatering.value ? "Mostra giornaliero" : "Mostra puntuale"
}

const selectedTimestamp = ref(Math.floor(Date.now()/1000))
function selectedTime(time){
  selectedTimestamp.value = time 
}

</script>

<template>

  <div class="container align-top mt-5 pt-5 pt-sm-3">
    <div v-if="showCustomizeInput" class="row m-2" id="timeperiod" >
      <div class="col d-flex justify-content-center">
        <span class="m-1">Periodo da:</span>
        <input type="date" name="timeperiod_from" v-model="selectedDateFrom">
        <span class="m-1"> a:</span>
        <input type="date" name="timeperiod_to" v-model="selectedDateTo">
        <div class="btn-group-toggle" data-toggle="buttons">
          <label class="btn btn-sm btn-secondary" style="margin-left:10px;">
            <input type="radio" name="timefilter" value="timefilter_customizesearch_day" @click="updateCustomTimestamps" autocomplete="off"> Cerca
          </label>
        </div>
      </div>
    </div>

    <div class="m-2 col-md-12 d-flex flex-row justify-content-center flex-wrap">
      <div v-if="fields.value" class="d-flex align-items-center flex-wrap">
        <p class="px-2 m-0">Campo:</p>
        <button class="btn btn-secondary dropdown-toggle my-1 px-2" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
          {{ selectedFieldName }}
        </button>
        <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <li v-for="(item, index) in fields.value" :key="index">
            <a
                class="dropdown-item"
                href="#"
                @click.prevent="selectField(item)">
               {{createFieldName(item)}}
            </a>
          </li>
        </ul>
      </div>
      <div v-if="thesis.value" class="d-flex align-items-center flex-wrap">
        <p class="px-2 mb-0">Tesi: </p>
        <button class="btn btn-secondary dropdown-toggle my-1 px-2" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
          {{ selectedThesisName }}
        </button>
        <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <li v-for="(item, index) in thesis.value" :key="index">
            <a
                class="dropdown-item"
                href="#"
                @click.prevent="selectItem(item)">
               {{createThesisName(item)}}
            </a>
          </li>
        </ul>

      </div>
    </div>

    <div v-if="hasUserPermission('MO')" class="my-3 container col-md-12">
      <div class="humidity-card card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span>Matrice dell'umidità</span>
          <div>
            <button class="btn btn-sm btn-secondary m-1" type="button" @click="enableOptimalMatrix" id="optimal-heatmap-button">Mostra ottimo</button>
            <button class="btn btn-sm btn-secondary m-1" type="button" @click="enableDynamicHeatmap" id="dynamic-heatmap-button">Mostra evoluzione</button>
          </div>  
        </div>
        <div class="card-body">
          <div class="row">
            <span>Seleziona un istante temporale nel grafico di sinistra per mostrare la relativa matrice di umidità (Con "<strong>G</strong>" 
              si denota la posizione del gocciolatore):</span>
            <div class="col-lg-6 align-content-center">
              <HumidityMultiLineChart :config="JSON.stringify(connectionParams)" @selectTimestamp="selectedTime"></HumidityMultiLineChart>
            </div>
            <div class="col-lg-6">
              <HumidityHeatmap :config="JSON.stringify(connectionParams)" :selectedTimestamp="selectedTimestamp"></HumidityHeatmap>
            </div>
          </div>
          <OptimalHumidityHeatmap v-if="showOptimalMatrix" :config="JSON.stringify(connectionParams)" :selectedTimestamp="selectedTimestamp" :showDistance="hasUserPermission('*')"></OptimalHumidityHeatmap>
        </div>
      </div>
    </div>

    <div v-if="showDynamicHeatmap" class="my-3 container col-md-12">
      <div class="dynamicheatmap-card card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span>Evoluzione matrice dell'umidità</span>
        </div>
        <div class="card-body">
          <HumidityDynamicHeatmap v-if="hasUserPermission('MO')" :config="JSON.stringify(connectionParams)"></HumidityDynamicHeatmap>
        </div>
      </div>
    </div>

    <div v-if="hasUserPermission('MO')" class="my-3 container col-md-12">
      <div class="groundwaterpot-card card">
        <div class="card-header">Potenziale idrico</div>
        <div class="card-body">
          <GroundWaterPotentialChart style="height: 320px" :config="JSON.stringify(connectionParams)"></GroundWaterPotentialChart>
        </div>
      </div>
    </div>

    <div v-if="hasUserPermission('WA')" class="my-3 container col-md-12">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span>Calendario Irrigazione</span>
        </div>
          <div class="card-body p-1">
            <Calendar :config="JSON.stringify(connectionParams)"></Calendar>
          </div>
      </div>
    </div>

    <div v-if="hasUserPermission('MO')" class="my-3 container col-md-12">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span>Consiglio Irriguo, Irrigazione e Precipitazioni</span> 
          <button class="btn btn-sm btn-secondary" type="button" @click="enableDetailedAggregate" id="dynamic-heatmap-button">{{ detailedWateringButton }}</button>
        </div>
        <div v-if="!showDetailedWatering">
            <WaterAggregateChart :config="JSON.stringify(connectionParams)"></WaterAggregateChart>
        </div>
        <div v-else>
            <DripperAndPluvChart :config="JSON.stringify(connectionParams)"></DripperAndPluvChart> 
        </div>
      </div>
    </div>

    <div v-if="hasUserPermission('WA')" class="my-3 container col-md-12">
      <div class=" card">
        <div class="card-header">Potenziale Idrico Ottimale e Potenziale Idrico Medio Giornaliero</div>
        <div class="card-body">
          <DeltaChart style="height: 300px" :config="JSON.stringify(connectionParams)"></DeltaChart>
        </div>
      </div>
    </div>

    <div v-if="hasUserPermission('MO')" class="my-3 container">
      <div class="countors-card card">
        <div class="card-header">Matrici di media e varianza</div>
        <div class="card-body row">
          <div class="col-lg-6">
            <p>Matrice dell'umidità <strong>media</strong> lungo il periodo:</p>
            <CountorMeanChart :config="JSON.stringify(connectionParams)"></CountorMeanChart>
          </div>
          <div class="col-lg-6">
            <p>Matrice di <strong>varianza</strong> dell'umidità lungo il periodo:</p>
            <CountorStdChart :config="JSON.stringify(connectionParams)"></CountorStdChart>
          </div>  
        </div>
      </div>
    </div>

    <div v-if="hasUserPermission('MO')" class="my-3 container col-md-12">
      <div class="card">
        <div class="card-header">Temperatura dell'aria</div>
        <div class="card-body">
          <AirTemperatureChart style="height: 300px" :config="JSON.stringify(connectionParams)"></AirTemperatureChart>
        </div>
      </div>
    </div>
    <div style="visibility: hidden">
      {{selectedTimestampTo}} - {{customSelectedTimestampTo}}
      {{customSelectedTimestampFrom}} - {{selectedTimestampFrom}}
    </div>

  </div>
</template>

<style scoped>

input[type=radio] {
  position: absolute;
  clip: rect(0,0,0,0);
  pointer-events: none;
}

.timefilter{
  margin-right: 10px;
}

</style>
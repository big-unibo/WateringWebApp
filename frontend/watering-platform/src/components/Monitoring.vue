<script setup>

import { computed, onMounted, reactive, ref, watch } from "vue";
import LogComponent from './LogComponent.vue';
import UpdateOptimalStateComponent from './UpdateOptimalStateComponent.vue';
import { useRouter } from "vue-router";
import authService from '@/services/auth.service';
import WateringAdviceSimulatorComponent from './WateringAdviceSimulatorComponent.vue';


const router = useRouter()

const props = defineProps(['token', 'user'])

let showCustomizeInput = ref(false)

let selectedTimestampFrom = ref(getCurrentTimestampMinusDays(7))
let selectedTimestampTo = ref(getCurrentTimestampMinusDays(0))

let customSelectedTimestampFrom = ref(getCurrentTimestampMinusDays(7))
let customSelectedTimestampTo = ref(getCurrentTimestampMinusDays(0))

let selectedSectorName = ref("Seleziona un settore")
let selectedThesisName = ref("Seleziona una tesi")
let selectedTimeLabel = ref("")

let selectedThesis = ref({})

let showDynamicHeatmap = ref(false)
let showOptimalMatrix = ref(false)
let showDetailedWatering = ref(false)
let detailedWateringButton = ref("Mostra puntuale")

const token = computed(() => props.token)
const baseConnectionParams = ref("{}")

const userPermissions = reactive({})
const sectors = ref([])
const theses = ref([])

onMounted(async () => {
  if (!token) {
    await router.push('/login')
  }
})

watch(token, async (newToken) => {
  if (newToken) {
    await updateUserSectors();
    updateConnectionParams();
  }
}, { immediate: true });

function updateConnectionParams() {
  if (selectedThesis.value) {
    const params = {
      environment: {
        host: import.meta.env.VITE_BACKEND_ADDRESS,
        token: token.value,
      },
      paths: selectedThesis.value,
      params: {
        timeFilterFrom: selectedTimestampFrom.value,
        timeFilterTo: selectedTimestampTo.value,
      },
    }
    baseConnectionParams.value = JSON.stringify(params)
  }
}

const selectedDateFrom = computed({
  get: () => {
    const timestamp = customSelectedTimestampFrom.value * 1000;
    return new Date(timestamp).toISOString().slice(0, 10);
  },
  set: (newValue) => {
    if (Date.parse(newValue)) {
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
    if (Date.parse(newValue)) {
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

  if (timeFilter != 'customize_day') {
    updateConnectionParams()
    updateUserSectors()
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

function updateCustomTimestamps() {
  selectedTimestampFrom.value = customSelectedTimestampFrom.value
  selectedTimestampTo.value = customSelectedTimestampTo.value
  updateConnectionParams()
  updateUserSectors()
}

function selectThesis(thesis) {
  selectedThesisName.value = createThesisName(thesis)
  selectedThesis.value.thesisId = thesis.id
  updateConnectionParams()
}

async function selectSector(sector) {
  selectedSectorName.value = createSectorName(sector)
  selectedThesis.value.sectorId = sector.id
  updateConnectionParams()
  const sectorInfo = await authService.getSectorInfo(token.value, sector.id)
  theses.value = sectorInfo?.theses ?? []
  if (theses.value.length > 0) {
    selectThesis(theses.value[0])
  }
}

function createSectorName(item) {
	if (!item) return ''
	return `${item.organization.name}; ${item.company.name}; ${item.field.name}; ${item.name}`
}

function createThesisName(item) {
	if (!item) return ''
	return `Tesi ${item.name}`
}

function isLabelSelected(value) {
  return selectedTimeLabel.value === value
}

async function updateUserSectors() {
  if (token.value) {
    try {
      sectors.value = await authService.retrieveUserSectors(token.value, selectedTimestampFrom.value, selectedTimestampTo.value)
      if (sectors.value && sectors.value.length > 0) {
        selectSector(sectors.value[0])
      }
    }
    catch {
      console.log("Errore recuperando i settori")
    }
  }
}

function hasUserPermission(permission = null) {
  // if(userPermissions && userPermissions.value && userPermissions.value.permissions) {
  //   if(!selectedThesis.value || Object.keys(selectedThesis.value).length === 0) return false;
  //   if(userPermissions.value.role === 'admin') return true
  //   const keySelected = createFieldName(selectedThesis.value)+ createThesisName(selectedThesis.value)
  //   for(const field of userPermissions.value.permissions) {
  //     const tmpKey = createFieldName(field)+ createThesisName(field)
  //     if(keySelected === tmpKey) {
  //       return field.permissions.includes(permission)
  //     }
  //   }
  // }
  // return false
  return true;
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

const selectedTimestamp = ref(Math.floor(Date.now() / 1000))

function selectedTime(time) {
  let timeDetail = time.detail;

  if (Array.isArray(timeDetail) && timeDetail.length > 0) {
    timeDetail = timeDetail[0];
  }

  selectedTimestamp.value = timeDetail;
}

</script>

<template>

  <div class="container align-top mt-5 pt-5 pt-sm-3">
    <div class="row m-2">
      <div class="col d-flex justify-content-center">
        <div class="btn-group-toggle text-center" data-toggle="buttons">
          <span class="m-2">Filtro:</span>
          <label :class="{ active: isLabelSelected('customize_day') }" class="btn btn-sm btn-secondary timefilter m-1">
            <input type="radio" name="timefilter-radio" value="customize_day" autocomplete="off"
              @click="selectTimePeriod('customize_day')">Altro periodo
          </label>
          <label class="btn btn-sm btn-secondary timefilter m-1" :class="{ active: isLabelSelected('30_day') }">
            <input type="radio" name="timefilter-radio" value="30_day" autocomplete="off"
              @click="selectTimePeriod('30_day')">Ultimo mese
          </label>
          <label class="btn btn-sm btn-secondary timefilter m-1" :class="{ active: isLabelSelected('7_day') }">
            <input type="radio" id="one_week_filter" name="timefilter-radio" value="7_day" autocomplete="off"
              @click="selectTimePeriod('7_day')" checked>Ultima settimana
          </label>
          <label class="btn btn-sm btn-secondary timefilter m-1" :class="{ active: isLabelSelected('24_hours') }">
            <input type="radio" name="timefilter-radio" value="24_hour" @click="selectTimePeriod('24_hours')"
              autocomplete="off">Ultime 24h
          </label>
        </div>
      </div>
    </div>
    <div v-if="showCustomizeInput" class="row m-2" id="timeperiod">
      <div class="col d-flex justify-content-center">
        <span class="m-1">Periodo da:</span>
        <input type="date" name="timeperiod_from" v-model="selectedDateFrom">
        <span class="m-1"> a:</span>
        <input type="date" name="timeperiod_to" v-model="selectedDateTo">
        <div class="btn-group-toggle" data-toggle="buttons">
          <label class="btn btn-sm btn-secondary" style="margin-left:10px;">
            <input type="radio" name="timefilter" value="timefilter_customizesearch_day" @click="updateCustomTimestamps"
              autocomplete="off"> Cerca
          </label>
        </div>
      </div>
    </div>

    <div class="m-2 col-md-12 d-flex flex-row justify-content-center flex-wrap">
			<div v-if="sectors.length > 0" class="d-flex align-items-center flex-wrap">
				<p class="px-2 m-0">Settore:</p>
				<button class="btn btn-secondary dropdown-toggle my-1 px-2" type="button" id="dropdownMenuSector"
					data-bs-toggle="dropdown" aria-expanded="false">
					{{ selectedSectorName }}
				</button>
				<ul class="dropdown-menu" aria-labelledby="dropdownMenuSector">
					<li v-for="(item, index) in sectors" :key="index">
						<a class="dropdown-item" href="#" @click.prevent="selectSector(item)">
							{{ createSectorName(item) }}
						</a>
					</li>
				</ul>
			</div>

			<div v-if="theses.length > 0" class="d-flex align-items-center flex-wrap">
				<p class="px-2 mb-0">Tesi: </p>
				<button class="btn btn-secondary dropdown-toggle my-1 px-2" type="button" id="dropdownMenuThesis"
					data-bs-toggle="dropdown" aria-expanded="false">
					{{ selectedThesisName }}
				</button>

				<ul class="dropdown-menu" aria-labelledby="dropdownMenuThesis">
					<li v-for="(item, index) in theses" :key="index">
						<a class="dropdown-item" href="#" @click.prevent="selectThesis(item)">
							{{ createThesisName(item) }}
						</a>
					</li>
				</ul>
			</div>
		</div>

    <div v-if="selectedThesis.thesisId" class="my-3 container col-md-12">
			<div class="humidity-card card">
				<div class="card-header d-flex justify-content-between align-items-center">
					<span>Matrice dell'umidità</span>
					<div>
						<WateringAdviceSimulatorComponent v-if="true"
							:config="baseConnectionParams" :selectedTimestamp="selectedTimestamp" />
						<UpdateOptimalStateComponent v-if="true"
							:config="baseConnectionParams" :selectedTimestamp="selectedTimestamp" /> 
						<button class="btn btn-sm btn-secondary m-1" type="button" @click="enableOptimalMatrix"
							id="optimal-heatmap-button">Mostra ottimo</button>
						<button class="btn btn-sm btn-secondary m-1" type="button" @click="enableDynamicHeatmap"
							id="dynamic-heatmap-button">Mostra evoluzione</button>
					</div>
				</div>
				<div class="card-body">
					<div class="row">
						<span>Seleziona un istante temporale nel grafico di sinistra per mostrare la relativa matrice di
							umidità (Con "<strong>G</strong>"
							si denota la posizione del gocciolatore):</span>
						<div class="col-lg-6 align-content-center">
							<humiditymultiline-chart-smarter :config="baseConnectionParams"
								@selectTimestamp="selectedTime"></humiditymultiline-chart-smarter>
						</div>
						<div class="col-lg-6">
							<humiditymap-smarter :config="baseConnectionParams"
								:selectedTimestamp="selectedTimestamp"></humiditymap-smarter>
						</div>
					</div>
					<optimal-humidity-heatmap-smarter v-if="showOptimalMatrix" :config="baseConnectionParams"
						:selectedTimestamp="selectedTimestamp" :showDistance="true"></optimal-humidity-heatmap-smarter>
				</div>
			</div>
		</div>


    <div v-if="showDynamicHeatmap" class="my-3 container col-md-12">
			<div class="dynamicheatmap-card card">
				<div class="card-header d-flex justify-content-between align-items-center">
					<span>Evoluzione matrice dell'umidità</span>
				</div>
				<div class="card-body">
					<heatmap-animation-smarter v-if="true" :config="baseConnectionParams"></heatmap-animation-smarter>
				</div>
			</div>
		</div>

    <div v-if="selectedThesis.thesisId" class="my-3 container col-md-12">
			<div class="groundwaterpot-card card">
				<div class="card-header">Potenziale idrico</div>
				<div class="card-body">
					<groundwaterpot-chart-smarter style="height: 320px" :config="baseConnectionParams" :extraParams="JSON.stringify({
						signalTypes: ['SOIL_WATER_CONTENT', 'SOIL_WATER_POTENTIAL'],
						aggregationType: 'AVG'
					})" />
				</div>
			</div>
		</div>

    <div v-if="selectedThesis.thesisId" class="my-3 container col-md-12">
			<div class="card">
				<div class="card-header d-flex justify-content-between align-items-center">
					<span>Consiglio Irriguo, Irrigazione e Precipitazioni</span>
					<button class="btn btn-sm btn-secondary" type="button" @click="enableDetailedAggregate"
						id="dynamic-heatmap-button">{{ detailedWateringButton }}</button>
				</div>
				<div v-if="!showDetailedWatering">
					<water-aggregate-chart-smarter :config="baseConnectionParams"></water-aggregate-chart-smarter>
				</div>
				<div v-else>
					<dripperandpluv-chart-smarter :config="baseConnectionParams" :extraParams="JSON.stringify({
						signalTypes: ['DRIPPER', 'PLUV_CURR', 'SPRINKLER'],
						aggregationType: 'SUM'
					})">
					</dripperandpluv-chart-smarter>
				</div>
			</div>
		</div>

    <div v-if="selectedThesis.sectorId" class="my-3 container col-md-12">
			<div class="card">
				<div class="card-header d-flex justify-content-between align-items-center">
					<span>Calendario Irrigazione</span>
				</div>
				<div class="card-body p-1">
					<calendar-smarter :config="baseConnectionParams"></calendar-smarter>
				</div>
			</div>
		</div>

    <div v-if="true" class="my-3 container col-md-12">
			<div class=" card">
				<div class="card-header">Potenziale Idrico Ottimale e Potenziale Idrico Medio Giornaliero</div>
				<div class="card-body">
					<optimal-distance-chart-smarter style="height: 300px"
						:config="baseConnectionParams"></optimal-distance-chart-smarter>
				</div>
			</div>
		</div>

    <div v-if="true" class="my-3 container">
			<div class="countors-card card">
				<div class="card-header">Matrici di media e varianza</div>
				<div class="card-body row">
					<div class="col-lg-6">
						<p>Matrice dell'umidità <strong>media</strong> lungo il periodo:</p>
						<meancountor-chart-smarter :config="baseConnectionParams"></meancountor-chart-smarter>
					</div>
					<div class="col-lg-6">
						<p>Matrice di <strong>varianza</strong> dell'umidità lungo il periodo:</p>
						<stdcountor-chart-smarter :config="baseConnectionParams"></stdcountor-chart-smarter>
					</div>
				</div>
			</div>
		</div>

    <div v-if="selectedThesis.thesisId" class="my-3 container col-md-12">
			<div class="card">
				<div class="card-header">Temperatura dell'aria</div>
				<div class="card-body">
					<airtemperature-chart-smarter style="height: 300px" :config="baseConnectionParams" :extraParams="JSON.stringify({
						signalTypes: ['AIR_TEMP'],
						aggregationType: 'AVG'
					})"></airtemperature-chart-smarter>
				</div>
			</div>
		</div>

    <div v-if="true" class="my-3 container col-md-12">
      <div class="card">
        <div class="card-header">Anomalie riscontrate</div>
        <div class="card-body">
          <LogComponent :config="baseConnectionParams"></LogComponent>
        </div>
      </div>
    </div>

    <div style="visibility: hidden">
      {{ selectedTimestampTo }} - {{ customSelectedTimestampTo }}
      {{ customSelectedTimestampFrom }} - {{ selectedTimestampFrom }}
    </div>

  </div>
</template>

<style scoped>
input[type=radio] {
  position: absolute;
  clip: rect(0, 0, 0, 0);
  pointer-events: none;
}

.timefilter {
  margin-right: 10px;
}
</style>
<script setup>
import { nextTick, ref, watchEffect} from 'vue';
import { Qalendar } from 'qalendar';
import {CommunicationService} from "../services/CommunicationService.js";
import { luxonDateTimeToString, luxonDateTimeToStringCalendar } from "../common/dateUtils.js";
import { Modal } from 'bootstrap'

const SCHEDULE_SAFE_PERIOD = 3600000

const communicationService = new CommunicationService();
const props = defineProps(['config'])
const getEventsEndpoint = "calendar"
const updateEventEndpoint = "updateWateringEvent"

const events = ref([]);
const selectedEvent = ref(null);
let eventsData = []

const config = ref({
  month: {
    showTrailingAndLeadingDates: true,
  },
  locale: 'it-IT',
  defaultMode: 'month',
  isSilent: true,
  disableModes: ['week','day'],
  style: {
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    colorSchemes: {
      sent: {
        color: "#fff",
        backgroundColor: "#a3c2c2",
      },
      disabled: {
        color: "#fff",
        backgroundColor: "#ff3336",
      },
      updated:{
        color: "#fff",
        backgroundColor: "#9966ff",
      },
      planned:{
        color: "#fff",
        backgroundColor: "#339CFF",
      }
    },
  },
});

watchEffect(async () => {
  let value = props.config;
  if(value) {
    await mountChart()
  }
});

function colorFunction(event) {
  if(!event.enabled || event.advice === 0){
    return "disabled"
  }
  if(event.updatedBy !== null){
    return "updated"
  }
  if( event.wateringStart < Date.now()/1000 && event.advice > 0) {
      return "sent"
  }
  return "planned"
}

function titleFunction(event) {
  if(!event.enabled){
    return "Irrigazione disabilitata"
  }
  if (event.advice === 0){
    return "Irrigazione disabilitata (Consiglio di non irrigare)"
  }
  if(event.updatedBy !== null){
    return "Irrigazione modificata"
  }
  if( event.wateringStart < Date.now()/1000 && event.advice > 0) {
      return "Irrigazione inviata"
  }
  return "Irrigazione programmata"
}

async function mountChart(timeFilter) {
  const parsed = JSON.parse(props.config);
  eventsData = []

  if(!timeFilter){
    timeFilter = {...parsed.params}
    timeFilter.timeFilterTo = timeFilter.timeFilterTo + 604800 //one week
  }

  const calendarResponse = await communicationService.getWateringSchedule(parsed.environment, parsed.paths, timeFilter, getEventsEndpoint)
  if(JSON.stringify(parsed) !== props.config){
      return
  }
  if(calendarResponse) {
    eventsData = calendarResponse.events
    const eventsCalendar = [] 
    for (const e of eventsData){
      const startDate = luxonDateTimeToStringCalendar(e.wateringStart)
      let endDate
      if(e.wateringEnd){
        endDate = luxonDateTimeToStringCalendar(e.wateringEnd)
      } else {
        endDate = startDate
      }

      const eventDescription = `<p><strong>Stato:</strong> ${e.enabled ? "Abilitata" : "Disabilitata"}</span></p>
      <p><strong>Tesi Considerata:</strong> ${e.plantRow}</span></p>
      <p class="mb-0"><strong>Acqua extra sistema:</strong> ${e.expectedWater ? e.expectedWater : 0} L</p>
      <p class="form-text">Es.(fertirrigazione, pioggia prevista)</p>
      <p><strong>Consiglio irriguo:</strong> ${e.advice !== null ? e.advice + " L" : "Non calcolato"} </p>
      <p><strong>Durata:</strong> ${e.duration !== null ? e.duration + " minuti" : "Non calcolata"}</p>
      ${ e.adviceTimestamp ? "<p><strong>Profilo di suolo considerato:</strong> " + luxonDateTimeToString(e.adviceTimestamp) + "</p>": ""}
      ${e.note ? ("<p><strong>Note:</strong> " + e.note + "</p>") : ""}
      ${ e.wateringStart * 1000 > Date.now() + SCHEDULE_SAFE_PERIOD ? "<button type=\"button\" class=\"btn btn-primary update-event\" id=" + e.date + ">Modifica</button>":""}`

      const event = { 
        title: titleFunction(e),
        with: e.updatedBy !== null ? "Modificato da: " + e.updatedBy : null,
        time: { start: startDate, end: endDate},
        colorScheme: colorFunction(e),
        isEditable: false,
        id: e.date,
        description: eventDescription
      }
      eventsCalendar.push(event)
    }
    events.value = eventsCalendar
  }
}



function refreshPeriod(p){
  const startTimestamp = new Date(p.start).getTime()/1000
  const endTimestamp = new Date(p.end).getTime()/1000
  mountChart({timeFilterFrom: startTimestamp, timeFilterTo: endTimestamp})
}

let activeModal
async function openModal(eventDate) {
  const target=eventDate.target;
  if(Array.from(target.classList).filter(c=>c==="update-event").length>0){
    selectedEvent.value = eventsData.filter(e=>e.date===target.id)[0]
    updateForm.value = {
      enabled: selectedEvent.value.enabled,
      wateringStartTime: new Date(selectedEvent.value.wateringStart * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expectedWater: selectedEvent.value.expectedWater,
      note: selectedEvent.value.note
    }
    await nextTick()
    activeModal = new Modal('#updateModal')
    activeModal.show()
  }
}

const updateForm = ref({
  enabled: false,
  wateringStartTime: "",
  expectedWater: 0,
  note: ""
})

async function submitForm(){
  const wateringStart = new Date(selectedEvent.value.date +" "+ updateForm.value.wateringStartTime).getTime()/1000
  const updatedEvent = selectedEvent.value
  updatedEvent.enabled = updateForm.value.enabled
  updatedEvent.wateringStart = wateringStart
  const expectedWater = parseFloat(updateForm.value.expectedWater)
  if(!isNaN(expectedWater)){
    updatedEvent.expectedWater = expectedWater
  }
  updatedEvent.note = updateForm.value.note

  const parsed = JSON.parse(props.config);
  await communicationService.updateEvent(parsed.environment, updateEventEndpoint, parsed.paths, updatedEvent)
  await mountChart()
  activeModal.hide()
}

function isValidTime(time){
  const wateringStart = new Date(selectedEvent.value.date +" "+ time)
  return wateringStart > Date.now() + SCHEDULE_SAFE_PERIOD
}
</script>

<template>
  <div class="is-light-mode">
    <Qalendar
      :events="events"
      :config="config" @updated-period="refreshPeriod" @edit-event="openModal" @click="openModal"/>
    <div v-if="selectedEvent" class="modal fade" id="updateModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-3"> Modifica Evento</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
            <form @submit.prevent="submitForm">
            <div class="modal-body">
              <div class="row text-center fs-5 p-2"> 
                <div class="col">{{titleFunction(selectedEvent)}} - {{ new Date(selectedEvent.date).toLocaleDateString("it-IT") }}</div>
              </div>
              <div class="form-group row align-items-center p-2 px-4">
                <div class="col-auto form-check form-switch">
                  <input type="checkbox" role="switch" class="form-check-input" id="enableEvent" name="enableEvent" v-model="updateForm.enabled">
                </div>
                <div class="col-auto"><label class="form-check-label" for="enableEvent">Abilita evento</label></div>
              </div>
              <div class="form-group row align-items-center p-2">
                <div class="col-auto"><label for="startTime">Ora di Inizio:</label></div>
                <div class="col-auto">
                  <input type="time" class="form-control" id="startTime" name="startTime" v-model="updateForm.wateringStartTime" :class="{ 'is-invalid': !isValidTime(updateForm.wateringStartTime) }" required>
                  <span v-if="!isValidTime(updateForm.wateringStartTime)" class="text-danger">Ora di inizio non valida</span>
                </div>
                
              </div>
              <div class="form-group row align-items-center p-2">
                <div class="col-auto"><label for="waterAmount">Acqua extra sistema (L):</label></div>
                <div class="col-auto"><input type="number" class="form-control" id="waterAmount" name="waterAmount" min="0" step="0.01" v-model="updateForm.expectedWater"></div>
              </div>
              <div class="form-group row align-items-center p-2">
                <div><label for="note">Note:</label></div>
                <div class="my-2"><textarea class="form-control" id="note" name="note" rows="2" v-model="updateForm.note"></textarea></div>
              </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                <button type="submit" class="btn btn-primary" :disabled="!isValidTime(updateForm.wateringStartTime)">Salva</button>
            </div>
          </form>
        </div>
      </div>  
    </div>
  </div>

</template>

<style>
@import "qalendar/dist/style.css";

.calendar-month__event .calendar-month__event-color{
  height: 20px !important;
  width: 20px !important;
}
</style>
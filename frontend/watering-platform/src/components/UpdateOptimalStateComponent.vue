<script setup>
import { onMounted, ref } from 'vue';
import HumidityHeatmap from '../../../abds-watering-charts-components/src/components/humidityheatmap-chart.ce.vue';
import { CommunicationService } from '../../../abds-watering-charts-components/src/services/CommunicationService';
//import { Modal, Collapse } from 'bootstrap'

const props = defineProps(['config', 'selectedTimestamp'])
const isModalShown = ref(false)
const communicationService = new CommunicationService();
const endpoint = "setOptState"
let modal
let successAlert

onMounted(()=>{
  //modal = new Modal('#updateStateModal')
})

function showModal(){
  isModalShown.value = true;
  modal.show()
}

function hideModal() {
  isModalShown.value = false;
  if(successAlert){
    successAlert.hide()
  }
  modal.hide()
}

async function setOptimal(){
    const parsed = JSON.parse(props.config);
    await communicationService.setOptimalStateByTimestamp(parsed.environment, endpoint, parsed.paths, props.selectedTimestamp)
    successAlert = new Collapse('#successMessage')
}

</script>

<template>
    <button type="button" class="btn btn-sm btn-secondary m-1" data-bs-toggle="modal" data-bs-target="#updateStateModal" @click="showModal">
        Imposta come matrice ottima
    </button>
    <div class="modal fade" id="updateStateModal" tabindex="-1" data-bs-backdrop="static" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-3"> Aggiorna matrice ottima</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="hideModal" ></button>
          </div>
            <form @submit.prevent="setOptimal">
            <div class="modal-body">
               <div class="collapse" id="successMessage">
                <div class="alert alert-success" role="alert" >
                  <svg class="bi me-1" width="24" height="24" role="img" aria-label="Success:"><use xlink:href="#check-circle-fill"/></svg>
                  Matrice ottima impostata correttamente
                </div>
               </div>
                <div v-if="isModalShown">
                  <HumidityHeatmap :config="props.config" :selectedTimestamp="props.selectedTimestamp"></HumidityHeatmap>
                </div>
                <div class="alert alert-warning d-flex justify-content-start align-items-center m-0" role="alert">
                  <svg class="bi m-2" width="24" height="24" role="img" aria-label="Warning:"><use xlink:href="#exclamation-triangle-fill"/></svg>
                  La matrice verrà impostata come ottima per tutte le tesi del campo {{ JSON.parse(props.config).paths.fieldName }} settore {{ JSON.parse(props.config).paths.sectorName }}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="hideModal">Chiudi</button>
                <button type="submit" class="btn btn-primary">Imposta come ottimo</button>
            </div>
          </form>
        </div>
      </div> 
    </div>

    <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
      <symbol id="check-circle-fill" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
      </symbol>
      <symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      </symbol>
    </svg>
</template>
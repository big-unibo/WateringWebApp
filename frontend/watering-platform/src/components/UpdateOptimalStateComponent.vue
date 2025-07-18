<script setup>
import { onMounted, ref } from 'vue';
import { CommunicationService } from 'smarter-charts';
import { Modal, Collapse } from 'bootstrap';

const updateStateModal = ref(null)
const successMessage = ref(null)

const props = defineProps(['config', 'selectedTimestamp'])
const isModalShown = ref(false)
const communicationService = new CommunicationService();
const endpoint = "setOptState"
let modal
let successAlert

onMounted(()=>{
  if (updateStateModal.value) {
    modal = new Modal(updateStateModal.value)
  } else {
    console.warn('Modal element not found')
  }
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
    successAlert = new Collapse(successMessage.value)
}

</script>

<template>
    <button type="button" class="btn btn-sm btn-secondary m-1" data-bs-toggle="modal" data-bs-target="#updateStateModal" @click="showModal">
        Imposta come matrice ottima
    </button>
    <div class="modal fade" ref="updateStateModal" tabindex="-1" data-bs-backdrop="static" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-3"> Aggiorna matrice ottima</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="hideModal" ></button>
          </div>
            <form @submit.prevent="setOptimal">
            <div class="modal-body">
               <div class="collapse" ref="successMessage">
                <div class="alert alert-success" role="alert" >
                  <svg class="bi me-1" width="24" height="24" role="img" aria-label="Success:"><use xlink:href="#check-circle-fill"/></svg>
                  Matrice ottima impostata correttamente
                </div>
               </div>
                <div v-if="isModalShown">
                  <humiditymap-smarter :config="props.config" :selectedTimestamp="props.selectedTimestamp"></humiditymap-smarter>
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
    </svg>
</template>
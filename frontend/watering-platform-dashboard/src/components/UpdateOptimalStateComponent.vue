<script setup>
import { onMounted, ref } from 'vue';
import { CommunicationService } from '@/services/communication.service';
import { Modal, Collapse } from 'bootstrap';

const updateStateModal = ref(null)
const successMessage = ref(null)
const errorMessage = ref(null)
const matrixId = ref(null)

const props = defineProps(['config', 'selectedTimestamp'])
const isModalShown = ref(false)
const updateWithMatrixId = ref(false)
const selectOptimalButtonText = ref("Imposta ottimo con matrice memorizzata")
const communicationService = new CommunicationService();
const endpoint = "setOptimalState"
const isLoading = ref(false);
let modal
let successAlert
let errorAlert

onMounted(() => {
  if (updateStateModal.value) {
    modal = new Modal(updateStateModal.value)
  } else {
    console.warn('Modal element not found')
  }
})

function showModal() {
  isModalShown.value = true;
  modal.show()
}

function hideModal() {
  isModalShown.value = false;
  if (successAlert) {
    successAlert.hide()
  }
  modal.hide()
}

async function setOptimal() {
  const parsed = JSON.parse(props.config);
  isLoading.value = true;

  try {
    if (updateWithMatrixId.value) {
      await communicationService.setOptimalStateByMatrixId(parsed.environment, endpoint, parsed.paths, matrixId.value)
    } else {
      await communicationService.setOptimalStateByTimestamp(parsed.environment, endpoint, parsed.paths, props.selectedTimestamp)
    }
    successAlert = new Collapse(successMessage.value)
    setTimeout(() => {
      successAlert.hide()
    }, 5000)
  } catch (e) {
    console.error(e)
    errorAlert = new Collapse(errorMessage.value)
    setTimeout(() => {
      errorAlert.hide()
    }, 5000)
  } finally {
    isLoading.value = false;
  }

}

function switchOptimal() {
  updateWithMatrixId.value = !updateWithMatrixId.value
  selectOptimalButtonText.value = updateWithMatrixId.value ? "Imposta ottimo con matrice attuale" : "Imposta ottimo con matrice memorizzata"
}

</script>

<template>
  <button type="button" class="btn btn-sm btn-secondary m-1" data-bs-toggle="modal" data-bs-target="#updateStateModal"
    @click="showModal">
    Imposta come matrice ottima
  </button>
  <div class="modal fade" ref="updateStateModal" tabindex="-1" data-bs-backdrop="static" role="dialog"
    aria-labelledby="myModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-3"> Aggiorna matrice ottima</h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"
            @click="hideModal"></button>
        </div>
        <form @submit.prevent="setOptimal">
          <div class="modal-body text-center">
            <div class="collapse" ref="successMessage">
              <div class="alert alert-success" role="alert">
                <svg class="bi me-1" width="24" height="24" role="img" aria-label="Success:">
                  <use xlink:href="#check-circle-fill" />
                </svg>
                Matrice ottima impostata correttamente
              </div>
            </div>
            <div class="collapse" ref="errorMessage">
              <div class="alert alert-danger" role="alert">
                <svg class="bi me-1" width="24" height="24" role="img" aria-label="Error:">
                  <use xlink:href="#exclamation-triangle-fill" />
                </svg>
                Impossibile aggiornare la matrice ottima
              </div>
            </div>
            <div v-if="isModalShown">
              <div class="m-2">
                <button type="button" class="btn btn-secondary" @click="switchOptimal">{{ selectOptimalButtonText
                  }}</button>
              </div>
              <div>
                <humiditymap-smarter v-if="!updateWithMatrixId" :config="JSON.stringify(props.config)"
                  :selectedTimestamp="props.selectedTimestamp"></humiditymap-smarter>
                <div v-else class="form-group row align-items-center justify-content-center p-2">
                  <div class="col-auto"><label for="optMatrixId">Id matrice ottima esistete:</label></div>
                  <div class="col-auto"><input type="number" class="form-control" id="optMatrixId" name="optMatrixId"
                      min="0" step="1" v-model="matrixId" required></div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="submit" class="btn btn-primary" :disabled="isLoading">

              <span v-if="isLoading" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>

              {{ isLoading ? 'Salvataggio in corso...' : 'Imposta come ottimo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
    <symbol id="check-circle-fill" viewBox="0 0 16 16">
      <path
        d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
    </symbol>
    <symbol id="exclamation-triangle-fill" viewBox="0 0 16 16">
      <path
        d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
    </symbol>
  </svg>
</template>
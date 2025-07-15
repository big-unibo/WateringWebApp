<script setup>
import { onMounted, ref} from 'vue';
import { CommunicationService } from 'smarter-charts';
import { Modal } from 'bootstrap';

const updateStateModal = ref(null)
const advice = ref(null)
const expectedWater = ref(0)
const adviceError = ref(false)
const props = defineProps(['config', 'selectedTimestamp'])
const isModalShown = ref(false)
const communicationService = new CommunicationService();
const endpoint = "wateringAdvice"
let modal

onMounted(()=>{
  if (updateStateModal.value) {
    modal = new Modal(updateStateModal.value)
  } else {
    console.warn('Modal element not found')
  }
})

function showModal(){
  isModalShown.value = true;
  simulateAdvice()
  modal.show()
}

function hideModal() {
    advice.value = null;
    expectedWater.value = 0;
    adviceError.value = false;
    isModalShown.value = false;
    modal.hide()
}

async function simulateAdvice(){
    adviceError.value = false;
    advice.value = null;
    const parsed = JSON.parse(props.config);
    const e = expectedWater.value;
    try {
        advice.value = await communicationService.getFieldInfo(parsed.environment, parsed.paths, {expectedWater: e, timestamp: Number(props.selectedTimestamp) + 60}, endpoint)
        advice.value.expectedWater = e;
        advice.error = false;
    } catch (error) {
        console.log("Error fetching watering advice:", error);
        adviceError.value = true;
        advice.value = null;
    }
}

</script>

<template>
    <button type="button" class="btn btn-sm btn-secondary m-1" data-bs-toggle="modal" data-bs-target="#simulateAdvice" @click="showModal">
        Simula consiglio irriguo
    </button>
    <div class="modal fade" ref="simulateAdvice" id="simulateAdvice" tabindex="-1" data-bs-backdrop="static" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-3"> Simula Consiglio Irriguo</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="hideModal" ></button>
          </div>
            <form @submit.prevent="simulateAdvice">
            <div class="modal-body">
                <div class="form-group row align-items-center justify-content-center p-2">
                    <div class="col-auto"><label for="waterAmount">Acqua extra sistema (L):</label></div>
                    <div class="col-auto"><input type="number" class="form-control" id="waterAmount" name="waterAmount" min="0" step="0.01" v-model="expectedWater"></div>
                    <div class="col-auto"><button type="submit" class="btn btn-primary">Simula consiglio irriguo</button></div>
                    <div v-if="isModalShown">
                    <humiditymap-smarter :config="props.config" :selectedTimestamp="props.selectedTimestamp"></humiditymap-smarter>
                    </div>
                </div>
                <div v-if="advice" class="">
                    <div class="alert alert-info" role="alert">
                        SMARTER consiglierebbe una irrigazione di {{advice.duration.toFixed(1)}} minuti pari a {{(advice.duration > 0 ? advice.advice - advice.expectedWater : 0).toFixed(1)}} L per irrigatore.
                    </div>
                </div>
                <div v-if="adviceError" class="alert alert-danger" role="alert">
                    Impossibile calcolare il consiglio irriguo.
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="hideModal">Chiudi</button>
            </div>
          </form>
        </div>
      </div> 
    </div>
</template>
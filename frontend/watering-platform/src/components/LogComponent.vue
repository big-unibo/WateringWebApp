<script setup>
import {watchEffect, ref} from "vue";
import {CommunicationService} from "../../../abds-watering-charts-components/src/services/CommunicationService.js";
import { luxonDateTimeToString } from "../../../abds-watering-charts-components/src/common/dateUtils.js";

const props = defineProps(['config'])

const groupedLogs = ref(null)
const communicationService = new CommunicationService();
 
watchEffect(async ()=>{
    if(props.config){
        const parsed = JSON.parse(props.config);
        groupedLogs.value = []
        const logs = await communicationService.getAPI(parsed.environment,"/logs",parsed.paths, parsed.params, "")
        if(JSON.stringify(parsed) !== props.config){
            return
        }
        groupedLogs.value = Array(...groupByType(logs).entries()).map(([k,v]) => {return [k,v.sort((a,b)=> b.timestamp - a.timestamp)]})
    }
})

const groupByType = (logs) => {
  return logs.reduce((accumulator, currentValue) => {
    const key = currentValue.type
    if (!accumulator.has(key))
      accumulator.set(key, []);
    accumulator.get(key).push({
        timestamp: currentValue.timestamp,
        description: currentValue.description
    });
    return accumulator;
  }, new Map());
}

</script>

<template>
    <div class="accordion" id="logsAccordion">
        <div v-for="[type, logs] in groupedLogs" :key="type" class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                    :data-bs-target="'#collapse' + type.replaceAll(' ', '')" aria-expanded="true"
                    :aria-controls="'collapse' + type.replaceAll(' ', '')">
                    <span class="position-relative p-1">
                        {{ type }}
                        <span class="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-danger">
                            {{ logs.length }}
                        </span>
                    </span>
                </button>
            </h2>

            <div :id="'collapse' + type.replaceAll(' ', '')" class="accordion-collapse collapse"
                data-bs-parent="#logsAccordion">
                <div class="p-2">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th scope="col">Timestamp</th>
                                <th scope="col">Descrizione</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="log in logs" :key="log.timestamp">
                                <td>{{ luxonDateTimeToString(log.timestamp) }}</td>
                                <td>{{ log.description }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
th {
    font-weight: bold
}
</style>
import DeltaChart from './components/delta-chart.ce.vue'
import AirTemperatureChart from "./components/airtemperature-chart.ce.vue"
import CountorMeanChart from "./components/countormean-chart.ce.vue"
import CountorStdChart from "./components/countorstd-chart.ce.vue"
import DripperAndPluvChart from "./components/dripperandpluv-chart.ce.vue"
import GroundWaterPotentialChart from "./components/groundwaterpot-chart.ce.vue"
import HumidityHeatmap from "./components/humidityheatmap-chart.ce.vue"
import HumidityMultiLineChart from "./components/humiditymultilinear-chart.ce.vue"
import HumidityDynamicHeatmap from './components/dynamic-heatmap-animator.ce.vue'
import WaterAggregateChart from './components/water-aggregate-chart.ce.vue'
import OptimalHumidityHeatmap from './components/optimal-humidity-heatmap-chart.ce.vue'
import Calendar from './components/calendar.ce.vue'

import {defineCustomElement} from "vue";

const deltaChart = defineCustomElement(DeltaChart);
const airTempChart = defineCustomElement(AirTemperatureChart)
const meanCountorChart = defineCustomElement(CountorMeanChart)
const stdCountorChart = defineCustomElement(CountorStdChart)
const dripperAndPluvChart = defineCustomElement(DripperAndPluvChart)
const groundWaterPotentialChart = defineCustomElement(GroundWaterPotentialChart)
const humidityHeatMap = defineCustomElement(HumidityHeatmap)
const humidityMultiLineChart = defineCustomElement(HumidityMultiLineChart)
const dynamicHeatmapAnimation = defineCustomElement(HumidityDynamicHeatmap)
const optimalHumidityHeatmap = defineCustomElement(OptimalHumidityHeatmap)
const calendar = defineCustomElement(Calendar);
const waterAggregateChart = defineCustomElement(WaterAggregateChart);

export function registerChartComponents(){
    customElements.define("delta-chart-smarter", deltaChart)
    customElements.define("airtemperature-chart-smarter", airTempChart)
    customElements.define("meancountor-chart-smarter", meanCountorChart)
    customElements.define("stdcountor-chart-smarter", stdCountorChart)
    customElements.define("dripperandpluv-chart-smarter", dripperAndPluvChart)
    customElements.define("groundwaterpot-chart-smarter", groundWaterPotentialChart)
    customElements.define("humiditymap-smarter", humidityHeatMap)
    customElements.define("humiditymultiline-chart-smarter", humidityMultiLineChart)
    customElements.define("heatmap-animation-smarter", dynamicHeatmapAnimation)
    customElements.define("optimal-humidity-heatmap-smarter", optimalHumidityHeatmap)
    customElements.define("calendar-smarter", calendar)
    customElements.define("water-aggregate-chart-smarter", waterAggregateChart)
}

export {CommunicationService} from "./services/CommunicationService.js";
export {luxonDateTimeToString, luxonDateTime, luxonDateTimeToStringCalendar} from "./common/dateUtils.js";
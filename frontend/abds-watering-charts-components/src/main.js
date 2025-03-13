import DeltaChart from './components/delta-chart.ce.vue'
import AirTemperatureChart from "./components/airtemperature-chart.ce.vue";
import CountorMeanChart from "./components/countormean-chart.ce.vue";
import CountorStdChart from "./components/countorstd-chart.ce.vue";
import DripperAndPluvChart from "./components/dripperandpluv-chart.ce.vue"
import GroundWaterPotentialChart from "./components/groundwaterpot-chart.ce.vue"
import HumidityHeatmap from "./components/humidityheatmap-chart.ce.vue"
import HumidityMultiLineChart from "./components/humiditymultilinear-chart.ce.vue"
import HumidityDynamicHeatmap from './components/dynamic-heatmap-animator.ce.vue'
import WaterAggregateChart from './components/water-aggregate-chart.ce.vue';

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

customElements.define("delta-chart", deltaChart);
customElements.define("airtemperature-chart", airTempChart);
customElements.define("meancountor-chart", meanCountorChart);
customElements.define("stdcountor-chart", stdCountorChart);
customElements.define("dripperandpluv-chart", dripperAndPluvChart);
customElements.define("groundwaterpot-chart", groundWaterPotentialChart);
customElements.define("humiditymap-chart", humidityHeatMap);
customElements.define("humiditymultiline-chart", humidityMultiLineChart);
customElements.define("heatmap-animation", dynamicHeatmapAnimation);

export { AirTemperatureChart };
export { DripperAndPluvChart };
export { WaterAggregateChart };
export { DeltaChart };
export { CountorMeanChart };
export { CountorStdChart };
export { GroundWaterPotentialChart };
export { HumidityHeatmap };
export { HumidityMultiLineChart };
export { HumidityDynamicHeatmap };
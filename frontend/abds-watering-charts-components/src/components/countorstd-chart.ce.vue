<script setup>
import * as d3 from "d3";
import {ref, nextTick, watchEffect} from "vue";
import {average, groupBy} from "../common/utils.js";
import {CommunicationService} from "../services/CommunicationService.js";

const communicationService = new CommunicationService();
const chartRef = ref(null);

const props = defineProps(['config'])
const endpoint = 'statisticsChart'
const showChart = ref(false)
const loadingFlag = ref(false)
const container = ref(null)
const imageStyle = ref({width:"", height:""})

watchEffect(async () => {
  let value = props.config;
  if(value) {
    await mountChart()
  }
});

async function mountChart() {
  const parsed = JSON.parse(props.config);
  let data = []
  showChart.value = false
  loadingFlag.value = true
  const chartDataResponse = await communicationService.getChartData(parsed.environment, parsed.paths, parsed.params, endpoint, 'values.0.measures')
  if(JSON.stringify(parsed) !== props.config){
      return
  }
  if(chartDataResponse) {
    data = chartDataResponse
    showChart.value = data.length > 0
  }  else {
    showChart.value = false
  }
  loadingFlag.value = false
  if(!showChart.value){
    return
  }

  let axisX = [];
  let axisY = [];
  let std = [];

  const Z = data.map(d => d.zz);
  const z_unique = [...new Set(Z)];

  if (z_unique.length <= 2) {
    data.forEach(d => {
      axisY.push(d.yy * -1)
      axisX.push(d.xx)
      std.push(d.std)
    });
  } else {
    const dataTemp = groupBy(data, t => t.yy);
    for (const [key, value] of Object.entries(dataTemp)) {
      let dataTemp2 = groupBy(value, e => e.xx)
      for (const [key2, value2] of Object.entries(dataTemp2)) {
        let stds_to_std = []
        let temp_y, temp_x
        dataTemp2.forEach(d => {
          stds_to_std.push(parseFloat(d.std))
          temp_x = d.xx;
          temp_y = d.yy;
        });
        axisY.push(temp_y * -1)
        axisX.push(temp_x)
        std.push(average(stds_to_std))
      }
    }
  }

  let margin = {top: 10, bottom: 35, left: 47, right: 85}

  const numCellInWidth = ((Math.max(...axisX) - Math.min(...axisX)) / 5) + 1
  const numCellInHeight = (((Math.min(...axisY) * -1) - (Math.max(...axisY) * -1)) / 5) + 1

  if(!container.value){
    await nextTick()
  }

  const containerWidth = container.value.offsetWidth
  let cellSize
  if(numCellInWidth > numCellInHeight){
    cellSize = (containerWidth - margin.left - margin.right) / numCellInWidth
  } else {
    cellSize = (containerWidth - margin.left - margin.right) / numCellInHeight
  }

  let width = cellSize * numCellInWidth + margin.left + margin.right
  let height = cellSize * numCellInHeight + margin.top + margin.bottom

  imageStyle.value.width = width + "px"
  imageStyle.value.height = height + "px"

  let svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  width -= margin.left + margin.right
  height -= margin.top + margin.bottom

  let x = d3.scaleLinear()
      .domain([Math.min(...axisX), Math.max(...axisX)])
      .range([ 0, width]);
  svg.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x));

  let y = d3.scaleLinear()
      .domain([Math.max(...axisY), Math.min(...axisY)])
      .range([0, height]);
  svg.append("g").call(d3.axisLeft(y));

  const contours = d3.contours().size([numCellInWidth, numCellInHeight]).thresholds(d3.range(-200, 10000));

  const mycolor = function (d) {
    if (d <= 5) {
      return d3.color("rgba(49, 102, 140, 1)");
    } else if (d <= 10) {
      return d3.color("rgba(35, 130, 140, 1)");
    } else if (d <= 20) {
      return d3.color("rgba(28, 156, 135, 1)");
    } else if (d <= 30) {
      return d3.color("rgba(51, 181, 120, 1)");
    } else if (d <= 50) {
      return d3.color("rgba(110, 204, 87, 1)");
    } else if (d <= 70) {
      return d3.color("rgba(179, 220, 41, 1)");
    } else return d3.color("rgba(253, 230, 36, 1)");
  };

  // Function to scale contours coordinates
  const scaleCoordinates = (geometry) => {
      geometry.coordinates = geometry.coordinates.map(polygon =>
          polygon.map(ring =>
              ring.map(([x, y]) => [x * (width / numCellInWidth), y * (height / numCellInHeight)])
          )
      );
      return geometry;
  };

  svg.selectAll("path")
      .data(contours(std).map(feature => scaleCoordinates(feature)))
      .enter().append("path")
      .attr("d", d3.geoPath(d3.geoIdentity()))
      .attr("fill", function (d) { return mycolor(d.value); });

  const ticks2 = [5, 10, 20, 30, 50, 70, 90];
  const ticksLabels2 = ["[0, 5)", "[5, 10)", "[10, 20)", "[20, 30)", "[30, 50)", "[50, 70)", "[70, 90)"];

  var size = 15

  svg.selectAll("mydots")
      .data(ticks2)
      .enter()
      .append("rect")
      .attr("x", width + size/2)
      .attr("y", function (d, i) {
        return i * (size + 5)
      }) // 100 is where the first dot appears. 25 is the distance between dots
      .attr("width", size)
      .attr("height", size)
      .style("fill", function (d) {return mycolor(d)})

  svg.selectAll("mylabels")
      .data(ticksLabels2)
      .enter()
      .append("text")
      .attr("x", width + size * 2)
      .attr("y", function (d, i) {return i * (size + 5) + (size / 2)}) // 100 is where the first dot appears. 25 is the distance between dots
      .style("fill", function (d, i) {return mycolor(ticks2[i])})
      .text(function (d) {return d})
      .attr("text-anchor", "left")
      .attr("font-size", 10)
      .style("alignment-baseline", "middle")

  svg.append("text")
      .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.bottom) + ")")
      .style("text-anchor", "middle")
      .attr("font-size", 14)
      .text("Distanza dalla fila");

  svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .attr("font-size", 14)
      .text("Profondità");

  nextTick(() => {
    if(chartRef.value) {
      chartRef.value.replaceChildren(svg.node());
    }
  })
}

</script>

<template>
  <div ref="container">
    <svg v-if="showChart" :style="imageStyle" ref="chartRef"></svg>
    <div v-else-if="loadingFlag" class="d-flex justify-content-center align-items-center">
      <div class="spinner-border" role="status">
          <span class="sr-only">Caricamento...</span>
        </div>
      </div>
    <div v-else>Nessun dato disponibile.</div>
  </div>
</template>

<style>
@import '../assets/main.css';
</style>
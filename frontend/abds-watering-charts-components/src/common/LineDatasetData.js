import * as d3 from "d3";

export class LineDatasetData {

    constructor(label, data, fill, pointRadius, tension, colorFunction) {
        this.label = label;
        this.data = data;
        this.fill = fill
        this.pointRadius = pointRadius;
        this.tension = tension;
        this.colorFunction = colorFunction;
    }

    getDataSet(){
        return {
            label: this.label,
            data: this.data.map(value => JSON.parse(value)),
            fill: this.fill,
            borderColor: this.colorFunction(this.label),
            backgroundColor: this.colorFunction(this.label),
            tension: this.tension,
            pointRadius:this.pointRadius
        };
    }


}
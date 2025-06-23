
export class BarDatasetData {

    constructor(label, data, yAxisID, colorFunction) {
        this.label = label;
        this.data = data;
        this.yAxisID = yAxisID;
        this.colorFunction = colorFunction;
    }

    getDataSet() {
        return {
            label: this.label,
            data: this.data.map(value => JSON.parse(value)),
            borderColor: this.colorFunction(this.label),
            backgroundColor: this.colorFunction(this.label),
            yAxisID: this.yAxisID
        }
    }

}
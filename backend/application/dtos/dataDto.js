export class DataResponse {

    constructor(values) {
        this.values = values;
    }

}

export class DataValue {

    constructor(refStructureName, companyName, fieldName, sectorName, plantRow, colture, measures) {
        this.refStructureName = refStructureName;
        this.companyName = companyName;
        this.fieldName = fieldName;
        this.sectorName = sectorName;
        this.plantRow = plantRow;
        this.colture = colture;
        this.measures = measures;
    }

}

export class MeasureData {

    constructor(detectedValueTypeDescription, timestamp, value) {
        this.detectedValueTypeDescription = detectedValueTypeDescription;
        this.timestamp = timestamp;
        this.value = value;
    }

}

export class HumidityBinMeasureData {

    constructor(humidityBin, timestamp, count) {
        this.humidityBin = humidityBin;
        this.timestamp = timestamp;
        this.count = count;
    }

}

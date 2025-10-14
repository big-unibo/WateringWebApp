export class DataResponse {

    constructor(values) {
        this.values = values;
    }

}

// export class DataValue {

//     constructor(refStructureName, companyName, fieldName, sectorName, thesisName, colture, measures) {
//         this.refStructureName = refStructureName;
//         this.companyName = companyName;
//         this.fieldName = fieldName;
//         this.sectorName = sectorName;
//         this.thesisName = thesisName;
//         this.colture = colture;
//         this.measures = measures;
//     }
// }


export class SignalTypeData {
    constructor(
        thesisName,
        signalType,
        signalTypeDescription,
        signals,
    ){
        this.thesisName = thesisName,
        this.signalType = signalType,
        this.signalTypeDescription = signalTypeDescription,
        this.signals = signals
    }
}

export class SignalData {
    constructor(
        signalId,
        deviceId,
        signalDescription,
        x,
        y,
        z,
        virtual,
        unit,
        measurements
    ){
        this.signalId = signalId;
        this.deviceId = deviceId;
        this.signalDescription = signalDescription;
        this.x = x;
        this.y = y;
        this.z = z;
        this.virtual = virtual;
        this.unit = unit
        this.measurements = measurements;
    }
}

export class MeasureData {

    constructor(timestamp, value, computed) {
        this.timestamp = timestamp;
        this.value = value;
        this.computed = computed;
    }

}

// export class HumidityBinMeasureData {

//     constructor(humidityBin, timestamp, count) {
//         this.humidityBin = humidityBin;
//         this.timestamp = timestamp;
//         this.count = count;
//     }

// }

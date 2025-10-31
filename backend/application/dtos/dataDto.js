export class SignalTypeData {
  constructor(signalType, signalTypeDescription, signals, thesisName = null) {
    this.signalType = signalType;
    this.signalTypeDescription = signalTypeDescription;
    this.signals = signals;
    if (thesisName !== null) this.thesisName = thesisName;
  }
}

export class SignalData {
  constructor(signalId, deviceId, signalDescription, x, y, z, virtual, unit, measurements = null) {
    this.signalId = signalId;
    this.deviceId = deviceId;
    this.signalDescription = signalDescription;
    this.x = x;
    this.y = y;
    this.z = z;
    this.virtual = virtual;
    this.unit = unit;
    if (measurements !== null) this.measurements = measurements;
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

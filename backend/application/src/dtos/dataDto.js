export class SignalTypeData {
  constructor(signalType, signalTypeDescription, signals, thesisName) {
    this.signalType = signalType;
    this.signalTypeDescription = signalTypeDescription;
    this.signals = signals;
    this.thesisName = thesisName;
  }
}

export class SignalData {
  constructor({signalId, deviceId, signalDescription, sensorTechnology, x, y, z, virtual, unit, idOnProvider, lastMeasurementTimestamp, measurements}) {
    this.signalId = signalId
    this.deviceId = deviceId
    this.signalDescription = signalDescription
    this.sensorTechnology = sensorTechnology
    this.x = x
    this.y = y
    this.z = z
    this.virtual = virtual
    this.unit = unit
    this.idOnProvider = idOnProvider
    this.lastMeasurementTimestamp = lastMeasurementTimestamp
    this.measurements = measurements
  }
}


export class MeasureData {

    constructor(timestamp, value, computed) {
        this.timestamp = timestamp;
        this.value = value;
        this.computed = computed;
    }

}

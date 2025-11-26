export class CreateSignal {
    /**
     * @param {number} typeId - ID of the signal type (required)
     * @param {string} description - Optional description
     * @param {number} x - X coordinate (required)
     * @param {number} y - Y coordinate (required)
     * @param {number} z - Z coordinate (required)
     * @param {boolean} virtual - Indicates if the signal is virtual
     * @param {string} unit - Measurement unit
     * @param {string} idOnProvider  - Signal id for the provider
     * @param {string} sensorTechnology - Sensor technology
     */
    constructor({typeId, description, x, y, z, virtual, unit, idOnProvider, sensorTechnology}) {
        this.typeId = typeId;
        this.description = description;
        this.x = x;
        this.y = y;
        this.z = z;
        this.virtual = virtual;
        this.unit = unit;
        this.idOnProvider = idOnProvider;
        this.sensorTechnology = sensorTechnology;
    }
}

export class Device {
    constructor({deviceId, deviceType, deviceDescription, providerId, signals}){
        this.deviceId = deviceId
        this.deviceType = deviceType
        this.deviceDescription = deviceDescription
        this.providerId = providerId
        this.signals = signals
    }
}

export class Signal {
    constructor({signalId, signalDescription, signalType, signalTypeDescription, x, y, z, virtual, unit, lastMeasurementTimestamp, idOnProvider}) {
        this.signalId = signalId
        this.signalDescription = signalDescription
        this.signalType = signalType
        this.signalTypeDescription = signalTypeDescription
        this.x = x
        this.y = y
        this.z = z
        this.virtual = virtual
        this.unit = unit
        this.lastMeasurementTimestamp = lastMeasurementTimestamp
        this.idOnProvider = idOnProvider
    }
}

export class CreateDevice {
    /**
     * @param {string} type - Device type
     * @param {number} providerId - Provider ID
     * @param {string} description - Optional description
     * @param {Object} location - GeoJSON Point
     * @param {number} binningId  - Id of the binning profile
     * @param {Array<Signal>} signals - Array of signals
     */
    constructor(type, providerId, description, location, binningId, signals = []) {
        this.type = type;
        this.providerId = providerId;
        this.description = description;
        this.location = location;
        this.binningId = binningId;
        this.signals = signals;
    }
}


export class SignalAssociation {
    /**
     * 
     * @param {number} sourceId - Id of the device owning the signals
     * @param {SignalTargetType} targetType - Type of the target of the signal association
     * @param {number} targetId - Id of the association target
     * @param {validFrom} - Start of the validy period of the association
     */
    constructor(sourceId, targetType, targetId, validFrom) {
    this.sourceId = sourceId;
    this.targetType = targetType; 
    this.targetId = targetId;
    this.validFrom = validFrom;
  }
}

export const SignalTargetType = {
  FIELD: "field",
  SECTOR: "sector",
  THESIS: "thesis"
};

export class SignalUpdate{
    /**
     * @param {number} id
     * @param {string} description 
     * @param {string} idOnProvider 
     * @param {string} sensorTechnology 
     */
    constructor(id,description, idOnProvider, sensorTechnology){
        this.id = id;
        this.description = description;
        this.idOnProvider = idOnProvider;
        this.sensorTechnology = sensorTechnology
    }
}

export class Measurement{
    /**
     * @param {number} timestamp 
     * @param {boolean} computed
     * @param {number} value
     */
    constructor(timestamp, computed, value){
        this.timestamp = timestamp;
        this.computed = computed;
        this.value = value;
    }
}

export class AddMeasurementsDto{
    /**
     * @param {number} id - Id of the signal the measurements ar leated to
     * @param {Array<Measurement>} measurements - Array of measurements 
     */
    constructor(id, measurements){
        this.id = id;
        this.measurements = measurements;
    }
}
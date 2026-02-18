
export class Signal {
    constructor({signalId, signalDescription, signalType, signalTypeDescription, x, y, z, virtual, unit, lastMeasurementTimestamp, providerId, idOnProvider, sensorTechnology}) {
        this.id = signalId
        this.description = signalDescription
        this.signalType = signalType
        this.signalTypeDescription = signalTypeDescription
        this.x = x
        this.y = y
        this.z = z
        this.virtual = virtual
        this.unit = unit
        this.lastMeasurementTimestamp = lastMeasurementTimestamp
        this.providerId = providerId
        this.idOnProvider = idOnProvider
        this.sensorTechnology = sensorTechnology
    }
}

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

export class AddMeasurementsRequest{
    /**
     * @param {number} id - Id of the signal the measurements ar leated to
     * @param {Array<Measurement>} measurements - Array of measurements 
     */
    constructor(id, measurements){
        this.id = id;
        this.measurements = measurements;
    }
}

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
    constructor({typeId, description, x, y, z, virtual, unit, providerId, idOnProvider, sensorTechnology}) {
        this.typeId = typeId;
        this.description = description;
        this.x = x;
        this.y = y;
        this.z = z;
        this.virtual = virtual;
        this.unit = unit;
        this.providerId = providerId;
        this.idOnProvider = idOnProvider;
        this.sensorTechnology = sensorTechnology;
    }
}

export class SignalInfo {
    constructor({signalId, signalDescription, signalType, signalTypeDescription, x, y, z, virtual, unit, lastMeasurementTimestamp, providerId, idOnProvider, devices}) {
        this.id = signalId
        this.description = signalDescription
        this.signalType = signalType
        this.signalTypeDescription = signalTypeDescription
        this.x = x
        this.y = y
        this.z = z
        this.virtual = virtual
        this.unit = unit
        this.lastMeasurementTimestamp = lastMeasurementTimestamp
        this.providerId = providerId
        this.idOnProvider = idOnProvider
        this.devices = devices
    }
}

export class SignalType {
    constructor({id, name, description}) {
        this.id = id;
        this.name = name;
        this.description = description;
    }
}
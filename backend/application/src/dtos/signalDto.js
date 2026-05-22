
export class Signal {
    constructor({signalId, signalDescription, signalType, signalTypeDescription, x, y, z, virtual, unit, scaledUnit, scalingFactor, lastMeasurementTimestamp, providerId, idOnProvider, sensorTechnology, createdAt, disabledAt}) {
        this.id = signalId
        this.description = signalDescription
        this.signalType = signalType
        this.signalTypeDescription = signalTypeDescription
        this.x = x
        this.y = y
        this.z = z
        this.virtual = virtual
        this.unit = unit
        this.scaledUnit = scaledUnit
        this.scalingFactor = scalingFactor
        this.lastMeasurementTimestamp = lastMeasurementTimestamp
        this.providerId = providerId
        this.idOnProvider = idOnProvider
        this.sensorTechnology = sensorTechnology
        this.createdAt = createdAt
        this.disabledAt = disabledAt
    }
}

export class SignalUpdate{
    /**
     * @param {number} id
     * @param {string} description 
     * @param {string} idOnProvider 
     * @param {string} sensorTechnology
     * @param {number} scalingFactor
     * @param {string} scaledUnit
     */
    constructor(id,description, idOnProvider, sensorTechnology, scalingFactor, scaledUnit){
        this.id = id;
        this.description = description;
        this.idOnProvider = idOnProvider;
        this.sensorTechnology = sensorTechnology;
        this.scalingFactor = scalingFactor;
        this.scaledUnit = scaledUnit;
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
     * @param {number} scalingFactor - Scaling factor for the signal (default is 1)
     * @param {string} scaledUnit - Unit after applying scaling factor
     * @param {number} providerId - ID of the signal provider (required)
     * @param {string} idOnProvider  - Signal id for the provider
     * @param {string} sensorTechnology - Sensor technology
     * @param {number} [createdAt] - Timestamp of signal creation (optional)
     */
    constructor({typeId, description, x, y, z, virtual, unit, scalingFactor, scaledUnit, providerId, idOnProvider, sensorTechnology, createdAt}) {
        this.typeId = typeId;
        this.description = description;
        this.x = x;
        this.y = y;
        this.z = z;
        this.virtual = virtual;
        this.unit = unit;
        this.scalingFactor = scalingFactor;
        this.scaledUnit = scaledUnit;
        this.providerId = providerId;
        this.idOnProvider = idOnProvider;
        this.sensorTechnology = sensorTechnology;
        this.createdAt = createdAt;
    }
}

export class SignalInfo {
    constructor({signalId, signalDescription, signalType, signalTypeDescription, x, y, z, virtual, unit, scalingFactor, scaledUnit, lastMeasurementTimestamp, providerId, idOnProvider, devices, createdAt, disabledAt}) {
        this.id = signalId
        this.description = signalDescription
        this.signalType = signalType
        this.signalTypeDescription = signalTypeDescription
        this.x = x
        this.y = y
        this.z = z
        this.virtual = virtual
        this.unit = unit
        this.scalingFactor = scalingFactor
        this.scaledUnit = scaledUnit
        this.lastMeasurementTimestamp = lastMeasurementTimestamp
        this.providerId = providerId
        this.idOnProvider = idOnProvider
        this.createdAt = createdAt
        this.disabledAt = disabledAt
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
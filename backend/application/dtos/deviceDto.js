export class Signal {
    /**
     * @param {number} typeId - ID of the signal type (required)
     * @param {string} description - Optional description
     * @param {number} x - X coordinate (required)
     * @param {number} y - Y coordinate (required)
     * @param {number} z - Z coordinate (required)
     * @param {boolean} virtual - Indicates if the signal is virtual
     * @param {string} unit - Measurement unit
     * @param {string} idOnProvider 
     */
    constructor({typeId, description, x, y, z, virtual, unit, idOnProvider }) {
        this.typeId = typeId;
        this.description = description;
        this.x = x;
        this.y = y;
        this.z = z;
        this.virtual = virtual;
        this.unit = unit;
        this.idOnProvider = idOnProvider;
    }
}

export class Device {
    /**
     * @param {string} type - Device type
     * @param {number} providerId - Provider ID
     * @param {string} description - Optional description
     * @param {Object} location - GeoJSON Point
     * @param {Array<Signal>} signals - Array of signals
     */
    constructor( {type, providerId, description, location, signals = [] }) {
        this.type = type;
        this.providerId = providerId;
        this.description = description;
        this.location = location;
        this.signals = signals.map(sig => new Signal(sig));
    }
}


export class SignalAssociation {
    /**
     * 
     * @param {number} deviceId - Id of the device owning the signals
     * @param {SignalTargetType} targetType - Type of the target of the signal association
     * @param {number} targetId - Id of the association target
     * @param {validFrom} - Start of the validy period of the association
     */
    constructor({ deviceId, targetType, targetId, validFrom }) {
    this.deviceId = deviceId;
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
     */
    constructor({id,description, idOnProvider}){
        this.id = id;
        this.description = description;
        this.idOnProvider = idOnProvider;
    }
}

export class Measurement{
    /**
     * @param {number} timestamp 
     * @param {boolean} computed
     * @param {number} value
     */
    constructor({timestamp, computed, value}){
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
    constructor({id, measurements}){
        this.id = id;
        this.measurements = measurements;
    }
}
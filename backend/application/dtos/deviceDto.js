export class Signal {
    /**
     * @param {number} typeId - ID of the signal type (required)
     * @param {string} description - Optional description
     * @param {number} x - X coordinate (required)
     * @param {number} y - Y coordinate (required)
     * @param {number} z - Z coordinate (required)
     * @param {boolean} virtual - Indicates if the signal is virtual
     * @param {string} unit - Measurement unit
     */
    constructor({typeId, description, x, y, z, virtual, unit }) {
        this.typeId = typeId;
        this.description = description;
        this.x = x;
        this.y = y;
        this.z = z;
        this.virtual = virtual;
        this.unit = unit;
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
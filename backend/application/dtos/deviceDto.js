export class Device {
    constructor({deviceId, deviceType, deviceDescription, providerId, signals, location}){
        this.deviceId = deviceId
        this.deviceType = deviceType
        this.deviceDescription = deviceDescription
        this.providerId = providerId
        this.location = location,
        this.signals = signals
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
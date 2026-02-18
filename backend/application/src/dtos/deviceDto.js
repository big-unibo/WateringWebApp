export class Device {
    constructor({deviceId, deviceType, deviceDescription, signals, location}){
        this.id = deviceId
        this.type = deviceType
        this.description = deviceDescription
        this.location = location,
        this.signals = signals
    }
}

export class CreateDevice {
    /**
     * @param {string} type - Device type
     * @param {string} description - Optional description
     * @param {number} companyId - Company that devices belongs to
     * @param {Object} location - GeoJSON Point
     * @param {number} binningId  - Id of the binning profile
     */
    constructor(type, description, companyId, location, binningId) {
        this.type = type;
        this.description = description;
        this.companyId = companyId;
        this.location = location;
        this.binningId = binningId;
    }
}

export class DeviceAssociation {
    /**
     * 
     * @param {number} sourceId - Id of the device owning the signals
     * @param {DeviceTargetType} targetType - Type of the target of the signal association
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

export const DeviceTargetType = {
  FARM: "FARM",
  SECTOR: "SECTOR",
  THESIS: "THESIS"
};
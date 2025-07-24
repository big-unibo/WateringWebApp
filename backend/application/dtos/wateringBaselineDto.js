class WateringBaseline {

    /**
     * @param {string} refStructureName - Reference structure name
     * @param {string} companyName - Company name
     * @param {string} fieldName - Field name
     * @param {string} sectorName - Sector name
     * @param {number} maxIrrigation - Maximum irrigation amount
     * @param {number} irrigationBaseline - Baseline irrigation amount
     * @param {string} wateringHour - Time for watering
     * @param {number} ki - PID integral gain
     * @param {number} kp - PID proportional gain
     */
    constructor({
        refStructureName,
        companyName,
        fieldName,
        sectorName,
        maxIrrigation,
        irrigationBaseline,
        wateringHour,
        irrigationFrequency,
        ki,
        kp
    }) {
        this.refStructureName = refStructureName;
        this.companyName = companyName;
        this.fieldName = fieldName;
        this.sectorName = sectorName;
        this.maxIrrigation = maxIrrigation;
        this.irrigationBaseline = irrigationBaseline;
        this.wateringHour = wateringHour;
        this.irrigationFrequency = irrigationFrequency;
        this.ki = ki;
        this.kp = kp;
    }

}

export default WateringBaseline;

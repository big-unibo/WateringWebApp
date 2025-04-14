class WateringBaseline {

    /**
     * @param {string} refStructureName - Reference structure name
     * @param {string} companyName - Company name
     * @param {string} fieldName - Field name
     * @param {string} sectorName - Sector name
     * @param {number} maxIrrigation - Maximum irrigation amount
     * @param {number} irrigationBaseline - Baseline irrigation amount
     * @param {string} irrigationMasterThesis - Thesis related to irrigation
     * @param {string} wateringHour - Time for watering
     */
    constructor({
        refStructureName,
        companyName,
        fieldName,
        sectorName,
        maxIrrigation,
        irrigationBaseline,
        irrigationMasterThesis,
        wateringHour
    }) {
        this.refStructureName = refStructureName;
        this.companyName = companyName;
        this.fieldName = fieldName;
        this.sectorName = sectorName;
        this.maxIrrigation = maxIrrigation;
        this.irrigationBaseline = irrigationBaseline;
        this.irrigationMasterThesis = irrigationMasterThesis;
        this.wateringHour = wateringHour;
    }

}

export default WateringBaseline;

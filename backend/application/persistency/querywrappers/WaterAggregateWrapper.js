export class WateringAdviceWrapper {

    constructor(refStructureName, companyName, fieldName, detectedValueTypeDescription, sectorName, plantRow, value, timestamp) {
        this.refStructureName = refStructureName;
        this.companyName = companyName;
        this.fieldName = fieldName;
        this.detectedValueTypeDescription = detectedValueTypeDescription;
        this.sectorName = sectorName;
        this.plantRow = plantRow;
        this.value = value;
        this.timestamp = timestamp;
    }

}
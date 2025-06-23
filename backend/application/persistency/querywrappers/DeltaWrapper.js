export class DeltaWrapper {

    constructor(refStructureName, companyName, fieldName, sectorName, plantRow, value, timestamp, detectedValueTypeDescription) {
        this.refStructureName = refStructureName;
        this.companyName = companyName;
        this.fieldName = fieldName;
        this.sectorName = sectorName;
        this.plantRow = plantRow;
        this.value = value;
        this.timestamp = timestamp;
        this.detectedValueTypeDescription = detectedValueTypeDescription;
    }

}
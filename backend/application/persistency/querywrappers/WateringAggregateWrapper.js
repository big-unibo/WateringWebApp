export class WateringAggregateWrapper {

    constructor(refStructureName, companyName, fieldName, detectedValueTypeDescription, sectorName, thesisName, value, timestamp) {
        this.refStructureName = refStructureName;
        this.companyName = companyName;
        this.fieldName = fieldName;
        this.detectedValueTypeDescription = detectedValueTypeDescription;
        this.sectorName = sectorName;
        this.thesisName = thesisName;
        this.value = value;
        this.timestamp = timestamp;
    }

}
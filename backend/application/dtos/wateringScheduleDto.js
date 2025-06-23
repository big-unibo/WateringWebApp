export class WateringScheduleResponse {

    constructor(refStructureName, companyName, fieldName, sectorName, events) {
        this.refStructureName = refStructureName
        this.companyName = companyName
        this.fieldName = fieldName
        this.sectorName = sectorName
        this.events = events
    }

}

export class WateringEventDto {

    constructor(plantRow, date, wateringStart, wateringEnd, duration, enabled, expectedWater, advice, adviceTimestamp, updatedBy, updateTimestamp, note) {
        this.plantRow = plantRow;
        this.date = date;
        this.wateringStart = wateringStart;
        this.wateringEnd = wateringEnd;
        this.duration = duration;
        this.enabled = enabled;
        this.expectedWater = expectedWater;
        this.advice = advice;
        this.adviceTimestamp = adviceTimestamp;
        this.updatedBy = updatedBy;
        this.updateTimestamp = updateTimestamp;
        this.note = note;
    }
}
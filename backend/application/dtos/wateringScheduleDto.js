export class WateringScheduleResponse {

    constructor(sectorId, events, sectorName = null) {
        this.sectorId = sectorId
        this.sectorName = sectorName
        this.events = events
    }

}

export class WateringEventData {

    constructor( date, wateringStart, wateringEnd, duration, enabled, advice, expectedWater, note, updateTimestamp, updatedBy, theses ) {
        this.date = date;
        this.wateringStart = wateringStart;
        this.wateringEnd = wateringEnd;
        this.duration = duration;
        this.enabled = enabled;
        this.advice = advice;
        this.expectedWater = expectedWater;
        this.note = note;
        this.updateTimestamp = updateTimestamp;
        this.updatedBy = updatedBy;
        this.theses = theses
    }
}

export class ThesisContributionData {
    constructor(thesisId, thesisName, weight, imageTimestamp) {
        this.thesisId = thesisId;
        this.thesisName = thesisName;
        this.weight = weight;
        this.imageTimestamp = imageTimestamp;
    }
}
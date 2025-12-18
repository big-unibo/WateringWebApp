export class WateringScheduleResponse {

    constructor(sectorId, events, sectorName) {
        this.sectorId = sectorId
        this.sectorName = sectorName
        this.events = events
    }

}

export class WateringEventData {

    constructor(eventId, date, wateringStart, wateringEnd, duration, enabled, advice, expectedWater, note, updateTimestamp, updatedBy, theses) {
        this.eventId = eventId
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


export class WateringEvent {
    /**
     * @param {number} sectorId - ID of the sector where the watering event takes place
     * @param {number} wateringStart - Timestamp in seconds for the start of watering
     * @param {number} [expectedWater] - Optional expected amount of water
     * @param {string} [note] - Optional note for the event
     * @param {boolean} [enabled] - Whether the event is enabled (default: true)
     */
    constructor({ sectorId, wateringStart, expectedWater, note, enabled = true }) {
        this.sectorId = sectorId;
        this.wateringStart = wateringStart;
        this.expectedWater = expectedWater;
        this.note = note;
        this.enabled = enabled;
    }
}

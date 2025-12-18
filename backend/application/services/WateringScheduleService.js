import { SCHEDULE_SAFE_INTERVAL, WATERING_EVENTS_LOG_TABLE } from "../commons/constants.js";
import { WateringEvent, WateringScheduleResponse } from "../dtos/wateringScheduleDto.js";
import DtoConverter from "./DtoConverter.js";

const dtoConverter = new DtoConverter;

class WateringScheduleService {
    constructor(wateringScheduleRepository, wateringAdviceRepository, userActionService) {
        this.wateringScheduleRepository = wateringScheduleRepository
        this.wateringAdviceRepository = wateringAdviceRepository
        this.userActionService = userActionService
    }

    async getSectorSchedules(sectorId, timeFilterFrom, timeFilterTo) {
        const results = await this.wateringScheduleRepository.getSectorSchedules(sectorId, timeFilterFrom, timeFilterTo)
        if (results.length == 0) {
            return new WateringScheduleResponse(sectorId, [])
        }
        return dtoConverter.convertCalendarWrapper(results)[0];
    }

    async getUserWateringEvents(userId, timeFilterFrom, timeFilterTo) {
        const results = await this.wateringScheduleRepository.getUserWateringEvents(userId, timeFilterFrom, timeFilterTo);
        return dtoConverter.convertCalendarWrapper(results);
    }

    async updateWateringEvent(userId, eventId, fieldsToUpdate) {
        const result = await this.wateringScheduleRepository.updateWateringEvent(eventId, fieldsToUpdate)
        if (result) {
            await this.userActionService.logUpdate(userId, WATERING_EVENTS_LOG_TABLE, eventId, null);
        }
        return result
    }

    async isEventUpdateAllowed(eventId, newWateringStart) {
        const followingEvent = await this.wateringScheduleRepository.findFollowingEvent(eventId)
        if (followingEvent && followingEvent.wateringStart != null) {
            return followingEvent.wateringStart - SCHEDULE_SAFE_INTERVAL > newWateringStart;
        }
        return false
    }

    async createWateringEvent(userId, event) {
        const newEventId = await this.wateringScheduleRepository.createWateringEvent(event)
        if (newEventId) {
            await this.userActionService.logCreation(userId, WATERING_EVENTS_LOG_TABLE, newEventId, null);
        }
        return newEventId
    }

    async createPeriodicWateringEvent(userId, sectorId, timestampFrom, timestampTo) {

        let wateringFrequenciesList = await this.wateringAdviceRepository.getSectorWateringFrequency(sectorId, timestampFrom, timestampTo);
        wateringFrequenciesList.sort((a, b) => (a.validFrom || 0) - (b.validFrom || 0));

        let wateringTimestamp = timestampFrom;
        let eventIds = [];
        let paramIndex = 0;

        while (wateringTimestamp <= timestampTo) {

            while (paramIndex < wateringFrequenciesList.length) {
                const param = wateringFrequenciesList[paramIndex];
                const validFrom = param.validFrom ?? 0;
                const validTo = param.validTo ?? Infinity;

                if (wateringTimestamp >= validFrom && wateringTimestamp <= validTo) {
                    break;
                } else if (wateringTimestamp > validTo) {
                    paramIndex++;
                } else {
                    throw new Error(`No valid watering frequency found for timestamp ${wateringTimestamp}`);
                }
            }

            if (paramIndex >= wateringFrequenciesList.length) {
                throw new Error(`No valid watering frequency found for timestamp ${wateringTimestamp}`);
            }

            const currentParam = wateringFrequenciesList[paramIndex];
            const currentFrequency = currentParam.wateringFrequency * 3600;

            const newEventId = await this.createWateringEvent(userId, {
                sectorId,
                wateringStart: wateringTimestamp,
            });
            eventIds.push(newEventId);

            wateringTimestamp += currentFrequency;
        }

        return eventIds;
    }

    async deleteWateringEvents(userId, sectorId, timestamp) {
        const deletedEventsIds = await this.wateringScheduleRepository.deleteWateringEvents(sectorId, timestamp)
        if (deletedEventsIds) {
            await this.userActionService.logDeletion(userId, WATERING_EVENTS_LOG_TABLE, deletedEventsIds, null);
        }
        return deletedEventsIds
    }
}

export default WateringScheduleService;
import { SCHEDULE_SAFE_INTERVAL } from "../commons/constants.js";
import { WateringEvent, WateringScheduleResponse } from "../dtos/wateringScheduleDto.js";
import DtoConverter from "./DtoConverter.js";

const dtoConverter = new DtoConverter;

class WateringScheduleService {
    constructor(wateringScheduleRepository, wateringAdviceRepository) {
        this.wateringScheduleRepository = wateringScheduleRepository
        this.wateringAdviceRepository = wateringAdviceRepository
    }

    async getSchedule(sectorId, timeFilterFrom, timeFilterTo) {
        const results = await this.wateringScheduleRepository.getSchedule(sectorId, timeFilterFrom, timeFilterTo)
        if (results.length == 0) {
            return new WateringScheduleResponse(sectorId, [])
        }
        return dtoConverter.convertCalendarWrapper(results);
    }

    async updateWateringEvent(eventId, fieldsToUpdate) {
        return await this.wateringScheduleRepository.updateWateringEvent(eventId, fieldsToUpdate)
    }

    async isEventUpdateAllowed(eventId, newWateringStart) {
        const followingEvent = await this.wateringScheduleRepository.findFollowingEvent(eventId)
        if (followingEvent && followingEvent.wateringStart != null) {
            return followingEvent.wateringStart - SCHEDULE_SAFE_INTERVAL > newWateringStart;
        }
        return false
    }

    async createWateringEvent(event) {
        return await this.wateringScheduleRepository.createWateringEvent(event)
    }

    async createPeriodicWateringEvent(sectorId, timestampFrom, timestampTo) {

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

            const newEventId = await this.createWateringEvent({
                sectorId,
                wateringStart: wateringTimestamp,
            });
            eventIds.push(newEventId);

            wateringTimestamp += currentFrequency;
        }

        return eventIds;
    }
}

export default WateringScheduleService;


// import WateringScheduleRepository from '../persistency/repository/WateringScheduleRepository.js';
// import DtoConverter from './DtoConverter.js';
// import FieldRepository from '../persistency/repository/FieldRepository.js';
// import initUser from '../persistency/model/User.js';
// import initWateringSchedule from '../persistency/model/WateringSchedule.js';
// import { WateringScheduleResponse } from '../dtos/wateringScheduleDto.js';
// import initWateringThesis from '../persistency/model/Thesis.js';
// import initWateringSector from '../persistency/model/Sector.js';
// import initWateringAlgorithmParams from '../persistency/model/WateringAlgorithmParams.js';
// import initMatrixField from '../persistency/model/MatrixField.js';
// import initMatrixProfile from '../persistency/model/MatrixProfile.js';
// import initTranscodingField from '../persistency/model/TranscodingField.js';
// const dtoConverter = new DtoConverter();

// class WateringScheduleService {

//     constructor(sequelize) {
//         this.wateringScheduleRepository = new WateringScheduleRepository(initWateringSchedule(sequelize), initWateringThesis(sequelize), initUser(sequelize), sequelize);
//         this.fieldRepository = new FieldRepository(initMatrixProfile(sequelize), initMatrixField(sequelize), initTranscodingField(sequelize), initWateringThesis(sequelize), initWateringSector(sequelize), initWateringAlgorithmParams(sequelize), sequelize);
//     }

//     async getSchedule(refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, timestampTo) {
//         const results = await this.wateringScheduleRepository.getSchedule(refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, timestampTo)
//         if (results.length == 0) {
//             return new WateringScheduleResponse('iFarming', refStructureName, companyName, fieldName, sectorName, [])
//         }
//         return dtoConverter.convertWateringScheduleWrapper(results)
//     }

//     async updateWateringEvent(event, userId) {
//         await this.wateringScheduleRepository.updateWateringEvent(event, userId)
//         return
//     }

//     async createWateringEvent(event, userId) {
//         await this.wateringScheduleRepository.createWateringEvent(event, userId)
//         return
//     }

//     async createWateringCalendar(refStructureName, companyName, fieldName, sectorName, dateFrom, dateTo, userId) {
//         const algorithmParams = await this.fieldRepository.getWateringAlgorithmParams(refStructureName, companyName, fieldName, sectorName, new Date(dateFrom).getTime() / 1000);
//         if (!algorithmParams) {
//             throw new Error(`No watering algorithm parameters found for field ${refStructureName} - ${companyName} - ${fieldName} - ${sectorName}`);
//         }
//         let wateringTimestamp = new Date(dateFrom).setHours(algorithmParams.watering_hour.split(':')[0], algorithmParams.watering_hour.split(':')[1], algorithmParams.watering_hour.split(':')[2], 0);
//         const endDate = new Date(dateTo).setHours(23, 59, 59, 999);
//         while (wateringTimestamp <= endDate) {
//             const wateringEvent = {
//                 source: 'iFarming',
//                 refStructureName: refStructureName,
//                 companyName: companyName,
//                 fieldName: fieldName,
//                 sectorName: sectorName,
//                 date: new Date(wateringTimestamp).toISOString().split('T')[0],
//                 wateringStart: Math.floor(wateringTimestamp / 1000),
//                 enabled: true,
//                 expectedWater: 0
//             };
//             await this.createWateringEvent(wateringEvent, userId);
//             wateringTimestamp += algorithmParams.irrigation_frequency * 60 * 60 * 1000; // increment by period in milliseconds
//         }
//     }

//     async deleteWateringEvents(refStructureName, companyName, fieldName, sectorName, timestamp){
//         await this.wateringScheduleRepository.deleteWateringEvents(refStructureName, companyName, fieldName, sectorName, timestamp)
//     }

// }

// export default WateringScheduleService;
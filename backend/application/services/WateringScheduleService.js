import WateringScheduleRepository from '../persistency/repository/WateringScheduleRepository.js';
import DtoConverter from './DtoConverter.js';

import initUser from '../persistency/model/User.js';
import initWateringSchedule from '../persistency/model/WateringSchedule.js';
import { WateringScheduleResponse } from '../dtos/wateringScheduleDto.js';
import initWateringThesis from '../persistency/model/WateringThesis.js';
const dtoConverter = new DtoConverter();

class WateringScheduleService {

    constructor(sequelize) {
        this.wateringScheduleRepository = new WateringScheduleRepository(initWateringSchedule(sequelize), initWateringThesis(sequelize), initUser(sequelize), sequelize);
    }

    async getSchedule(refStructureName, companyName, fieldName, sectorName, plantRow, timestampFrom, timestampTo) {
        const results = await this.wateringScheduleRepository.getSchedule(refStructureName, companyName, fieldName, sectorName, plantRow, timestampFrom, timestampTo)
        if (results.length == 0) {
            return new WateringScheduleResponse(refStructureName, companyName, fieldName, sectorName, [])
        }
        return dtoConverter.convertWateringScheduleWrapper(results)
    }

    async updateWateringEvent(event, userId) {
        await this.wateringScheduleRepository.updateWateringEvent(event.refStructureName, event.companyName, event.fieldName, event.sectorName, event.plantRow, event.date,
            event.wateringStart, event.wateringEnd, event.duration, event.enabled, event.expectedWater, event.advice, event.adviceTimestamp, userId, event.note)
        return
    }

    async deleteWateringEvents(refStructureName, companyName, fieldName, sectorName, timestamp){
        await this.wateringScheduleRepository.deleteWateringEvents(refStructureName, companyName, fieldName, sectorName, timestamp)  
    }

}

export default WateringScheduleService;
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
            return new WateringScheduleResponse('iFarming', refStructureName, companyName, fieldName, sectorName, [])
        }
        return dtoConverter.convertWateringScheduleWrapper(results)
    }

    async updateWateringEvent(event, userId) {
        await this.wateringScheduleRepository.updateWateringEvent(event, userId)
        return
    }

    async createWateringEvent(event, userId) {
        await this.wateringScheduleRepository.createWateringEvent(event, userId)
        return
    }

    async deleteWateringEvents(refStructureName, companyName, fieldName, sectorName, timestamp){
        await this.wateringScheduleRepository.deleteWateringEvents(refStructureName, companyName, fieldName, sectorName, timestamp)  
    }

}

export default WateringScheduleService;
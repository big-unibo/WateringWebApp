import LogRepository from '../persistency/repository/LogRepository.js';

import initLog from '../persistency/model/Log.js';

class LogService {

    constructor(sequelize) {
        this.logRepository = new LogRepository(initLog(sequelize), sequelize);
    }

    async getLogs(refStructureName, companyName, fieldName, sectorName, plantRow, timestampFrom, timestampTo) {
        const results = await this.logRepository.getLogs(refStructureName, companyName, fieldName, sectorName, plantRow, timestampFrom, timestampTo)
        return results
    }
}

export default LogService;
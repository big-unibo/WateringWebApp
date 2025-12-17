import { QueryTypes } from 'sequelize'

class UserActionRepository {

    constructor(models, sequelize) {
        this.UserAction = models.UserAction
        this.sequelize = sequelize
    }


    async saveLogs(logEntries) {
        try {
            if (!logEntries || logEntries.length === 0) {
                return;
            }
            return await this.UserAction.bulkCreate(logEntries);

        } catch (error) {
            console.error('Error while writing logs to DB:', error);
            throw new Error(`Error while recording user action caused by: ${error.message}`);
        }
    }
}


export default UserActionRepository;
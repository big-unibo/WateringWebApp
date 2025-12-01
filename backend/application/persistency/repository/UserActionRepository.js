import { QueryTypes } from 'sequelize'

class UserActionRepository {

    constructor(models, sequelize) {
        this.UserAction = models.UserAction
        this.sequelize = sequelize
    }

    async saveLog(userId, action, table, idKeys, timestamp, description) {
        try {
            if (idKeys.length === 0) {
                return; 
            }

            const logRecords = idKeys.map(idKey => ({
                userId: userId,         
                action: action,
                table: table,             
                idKey: idKey,      
                timestamp: timestamp,
                description: description 
            }));

            await this.UserAction.bulkCreate(logRecords);
            
        } catch (error) {
            console.error('Error while writing log:', error);
            throw new Error(`Error while recording user action caused by: ${error.message}`);
        }
    }
}


export default UserActionRepository;
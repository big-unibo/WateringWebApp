const ActionTypes = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    DISABLE: 'DISABLE'
};

class UserActionService {

    constructor(userActionRepository) {
        this.userActionRepository = userActionRepository;
    }

    async _saveLog(userId, action, table, ids, description, payload = null) {
        const timestamp = Date.now() / 1000;
        const idKeys = Array.isArray(ids) ? ids : [ids];

        let payloadList;
        if (Array.isArray(payload) && payload.length === idKeys.length) {
            payloadList = payload;
        } else {
            payloadList = new Array(idKeys.length).fill(payload);
        }

        const logEntries = idKeys.map((id, index) => ({
            userId,
            action,
            table,
            idKey: id, 
            timestamp,
            description,
            payload: payloadList[index]
        }));

        try {
            return await this.userActionRepository.saveLogs(logEntries);
        } catch (error) {
            throw new Error(`Error logging user action caused by: ${error.message}`);
        }
    }
    
    async logCreation(userId, table, ids, description, payload = null) {
        return this._saveLog(userId, ActionTypes.CREATE, table, ids, description, payload  )
    }

    async logUpdate(userId, table, ids, description, payload = null) {
        return this._saveLog(userId, ActionTypes.UPDATE, table, ids, description, payload  )
    }
 
    async logDeletion(userId, table, ids, description, payload = null) {
        return this._saveLog(userId, ActionTypes.DELETE, table, ids, description, payload  )
    }

    async logDisabling(userId, table, ids, description, payload = null) {
        return this._saveLog(userId, ActionTypes.DISABLE, table, ids, description, payload )
    }
}

export default UserActionService;
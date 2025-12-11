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

    async _saveLog(userId, action, table, ids, description) {
        const timestamp = Date.now()/1000;
        const idKeys = Array.isArray(ids) ? ids : [ids];
        try{
            return await this.userActionRepository.saveLog(userId, action, table, idKeys, timestamp, description)
        } catch (error) {
            throw new Error(`Error loggin user action casued by by: ${error}`);
        }
    }

    async logCreation(userId, table, ids, description) {
        return this._saveLog(userId, ActionTypes.CREATE, table, ids, description )
    }

    async logUpdate(userId, table, ids, description) {
        return this._saveLog(userId, ActionTypes.UPDATE, table, ids, description )
    }
 
    async logDeletion(userId, table, ids, description) {
        return this._saveLog(userId, ActionTypes.DELETE, table, ids, description )
    }

    async logDisabling(userId, table, ids, description) {
        return this._saveLog(userId, ActionTypes.DISABLE, table, ids, description )
    }
}

export default UserActionService;
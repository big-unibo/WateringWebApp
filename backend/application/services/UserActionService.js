const ActionTypes = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
};

class UserActionService {

    constructor(userActionRepository) {
        this.userActionRepository = userActionRepository;
    }

    async _saveLog(userId, action, table, ids, description) {
        const timestamp = new Date()/1000;
        const ids = Array.isArray(ids) ? ids : [ids];
        this.userActionRepository.saveLog(userId, action, table, ids, timestamp, description)
    }

    async logCreation(userId, table, ids, description) {
        return this._saveLog(userId, ActionTypes.CREATE, table, ids, description )
    }

    async logUpdate(userId, table, ids, description) {
        return this._saveLog(userId, ActionTypes.UPDATE, table, ids, description )
    }
 
    async logDeletion(userId, table, ids,description) {
        return this._saveLog(userId, ActionTypes.DELETE, table, ids, description )
    }
}

export default UserActionService;
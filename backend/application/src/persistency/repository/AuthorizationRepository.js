import { ENTITY_ID_MAPPING } from "../../commons/permissionRoles.js";

class AuthorizationRepository {
    constructor(sequelize){
        this.sequelize = sequelize
    }

    async getUserAvailableIds(userId, entity){
        try {
            const query = `
                SELECT DISTINCT role, ${ENTITY_ID_MAPPING[entity]} AS id
                FROM master_data_permits
                WHERE user_id = :userId
            `
            const results = await this.sequelize.query(query, {
                replacements: { userId },
                type: this.sequelize.QueryTypes.SELECT
            });
            return results;
        } catch (error) {
            console.error(`Fail retrieving authorization data: ${error.message}`);
            throw error;
        }
    }

    async getUserRoles(userId, entity, id){
        try {
            const query = `
                SELECT DISTINCT role
                FROM master_data_permits
                WHERE user_id = :userId
                    ${entity!=null && id != null ? `AND ${ENTITY_ID_MAPPING[entity]} = :id`:''}
            `
            const results = await this.sequelize.query(query, {
                replacements: { userId, id },
                type: this.sequelize.QueryTypes.SELECT
            });
            return results;
        } catch (error) {
            console.error(`Fail retrieving authorization data: ${error.message}`);
            throw error;
        }
    }

}

export default AuthorizationRepository
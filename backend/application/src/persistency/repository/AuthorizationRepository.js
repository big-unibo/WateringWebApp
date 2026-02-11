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
                AND ${ENTITY_ID_MAPPING[entity]} IS NOT NULL
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

    async getUserRolesAndServices(userId, entity, id) {
        try {
            const query = `
                SELECT role, ARRAY_AGG(DISTINCT s) AS services
                FROM master_data_permits, UNNEST(services) AS s
                WHERE user_id = :userId
                    ${entity != null && id != null ? `AND ${ENTITY_ID_MAPPING[entity]} = :id` : ''}
                GROUP BY role;
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
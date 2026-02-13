import { COMPANIES_PERMITS_COLUMN_MAPPING, DEVICE_PERMITS_COLUMN_MAPPING } from "../../commons/permissionRoles.js";

class AuthorizationRepository {
    constructor(sequelize){
        this.sequelize = sequelize
    }

    async getUserFieldAvailableIds(userId, entity, service){
        try {
            const query = `
                SELECT DISTINCT role, ${COMPANIES_PERMITS_COLUMN_MAPPING[entity]} AS id
                FROM master_data_permits
                WHERE user_id = :userId
                AND ${COMPANIES_PERMITS_COLUMN_MAPPING[entity]} IS NOT NULL
                ${service != null ? `AND '${service}' = ANY(services)` : ''} 
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

    async getUserDeviceAvailableIds(userId, entity){
        try {
            const query = `
                SELECT DISTINCT role, ${DEVICE_PERMITS_COLUMN_MAPPING[entity]} AS id
                FROM devices_signals_permits
                WHERE user_id = :userId
                AND ${DEVICE_PERMITS_COLUMN_MAPPING[entity]} IS NOT NULL
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


    async getUserFieldsRoles(userId, entity, id, service) {
        try {
            const query = `
                SELECT DISTINCT role
                FROM master_data_permits
                WHERE user_id = :userId
                    ${entity != null && id != null ? `AND ${COMPANIES_PERMITS_COLUMN_MAPPING[entity]} = :id` : ''}
                    ${service != null ? `AND '${service}' = ANY(services)` : ''} 
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

    async getUserDeviceRoles(userId, entity, id) {
        try {
            const query = `
                SELECT DISTINCT role
                FROM devices_signals_permits
                WHERE user_id = :userId
                    ${entity != null && id != null ? `AND ${DEVICE_PERMITS_COLUMN_MAPPING[entity]} = :id` : ''}
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
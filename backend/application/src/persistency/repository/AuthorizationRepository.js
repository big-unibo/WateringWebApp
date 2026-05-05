import { COMPANIES_PERMITS_COLUMN_MAPPING, DEVICE_PERMITS_COLUMN_MAPPING } from "../../commons/permissionRoles.js";
import { TABLES } from "../../commons/constants.js"
import { Op, QueryTypes } from "sequelize"
import { _deleteFromModelByParams } from "../../commons/repositoryUtils.js"

class AuthorizationRepository {
    constructor(models, sequelize) {
        this.Permit = models.Permit
        this.User = models.User
        this.sequelize = sequelize
    }

    async getUserFieldAvailableIds(userId, entity, service) {
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

    async getUserDeviceAvailableIds(userId, entity) {
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

    async grantUser(userId, entityType, entityId, role, extraAttributes) {
        try {

            const existQuery = `SELECT * FROM ${TABLES[entityType]} WHERE id=:entityId`
            const results = await this.sequelize.query(existQuery, {
                replacements: { entityId },
                type: this.sequelize.QueryTypes.SELECT
            });
            if (results.length > 0) {
                return await this.Permit.create({
                    userId: userId,
                    table: TABLES[entityType],
                    idKey: entityId,
                    role: role,
                    extraAttributes: extraAttributes
                });
            } else {
                throw Error("Reqested entity does not exist")
            }
        } catch (error) {
            throw new Error(`Error saving new user permits caused by: ${error.message}`);
        }
    }

    async removeOldPermits(userId, entityType, entityId) {
        try {
            let companyIds = [];
            let sectorIds = [];

            if (entityType === 'COMPANY') {
                companyIds = [entityId];
                const sectorRows = await this.sequelize.query(
                    `SELECT DISTINCT "sector_id"
                    FROM master_data_permits
                    WHERE "user_id" = :userId
                        AND "company_id" = :companyId
                        AND "sector_id" IS NOT NULL
                    `,
                    {
                        replacements: { userId, companyId: entityId },
                        type: QueryTypes.SELECT
                    }
                );
                sectorIds = sectorRows.map(r => r.sector_id);
            } else if (entityType === 'SECTOR') {
                sectorIds = [entityId];
                const companyRows = await this.sequelize.query(
                    `SELECT DISTINCT "company_id"
                    FROM master_data_permits
                    WHERE "user_id" = :userId
                        AND "sector_id" = :sectorId
                        AND "company_id" IS NOT NULL
                    `,
                    {
                        replacements: { userId, sectorId: entityId },
                        type: QueryTypes.SELECT
                    }
                );
                companyIds = companyRows.map(r => r.company_id);
            } else {
                throw new Error(`Unsupported entityType: ${entityType}`);
            }
            const orConditions = [];
            if (companyIds.length > 0) {
                orConditions.push({
                    table: TABLES['COMPANY'],
                    id_key: { [Op.in]: companyIds },
                });
            }
            if (sectorIds.length > 0) {
                orConditions.push({
                    table: TABLES['SECTOR'],
                    id_key: { [Op.in]: sectorIds },
                });
            }

            return await _deleteFromModelByParams(this.Permit, {
                userId,
                [Op.or]: orConditions,
            })
        } catch (error) {
            throw new Error(`Error saving new user permits caused by: ${error.message}`);
        }
    }

    async getResourceRelatedPermissions(entityType, entityId){
        return await this.Permit.findAll({
            attributes: ['role', 'extraAttributes'],
            where: {
                table: TABLES[entityType],
                id_key: entityId
            },
            include: [{
                    model: this.User,
                    required: true,
                    attributes: ['id', 'name', 'email'],
                    as: "user"
            }],
            distinct: true
        })
    }

    async getCompanyUsers(companyId){
        try {
            const query = `
                SELECT u.id, u.name, u.email, ARRAY_AGG(DISTINCT p.role) AS roles
                FROM master_data_permits p
                    JOIN users u ON p.user_id = u.id 
                WHERE "company_id" = :companyId
                GROUP BY u.id, u.name, u.email
            `
            const results = await this.sequelize.query(query, {
                replacements: { companyId },
                type: this.sequelize.QueryTypes.SELECT
            });
            return results;
        } catch (error) {
            console.error(`Fail retrieving company users: ${error.message}`);
            throw error;
        }
    }

}

export default AuthorizationRepository
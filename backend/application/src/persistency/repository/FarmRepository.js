import { Op } from "sequelize";
import { _deleteFromModelByParams } from "../../commons/repositoryUtils.js";

class FarmRepository {

    constructor(models, sequelize) {
        this.Company = models.Company
        this.Farm = models.Farm
        this.Sector = models.Sector
        this.sequelize = sequelize
    }

    async farmExists(farmId) {
        const count = await this.Farm.count({
            where: { id: farmId }
        });
        return count > 0;
    }

    async getFarms(filteringIds, timeFilterFrom, timeFilterTo) {
        try {
            const where = {
                createdAt: { [Op.lt]: timeFilterTo },
                [Op.or]: [
                    { disabledAt: { [Op.gt]: timeFilterFrom } },
                    { disabledAt: { [Op.is]: null } }
                ]
            };

            if (Array.isArray(filteringIds)) {
                if (filteringIds.length > 0) {
                    where.id = {
                        [Op.in]: filteringIds
                    }
                } else {
                    return []
                }
            }

            const farms = await this.Farm.findAll({ where });
            return farms;
        } catch (error) {
            throw new Error(`Error retrieving farms caused by: ${error.message}`);
        }
    }

    async createFarm(farmName, companyId, location, createdAt) {
        try {
            const company = await this.Company.findByPk(companyId);
            if (!company) {
                throw new Error(`Company with ID ${companyId} does not exist.`);
            }

            const farmCreated = await this.Farm.create({
                farmName,
                companyId,
                location,
                createdAt
            });

            return farmCreated;
        } catch (error) {
            throw new Error(`Error creating new farm caused by: ${error.message}`);
        }
    }

    async getFarmDetails(farmId, timeFilterFrom, timeFilterTo, userId, isAdmin) {
        try {
            const query = `
            SELECT c.id AS "companyId", c.company_name AS "companyName", f.id, f.farm_name AS "farmName", f.location,
                json_agg(DISTINCT jsonb_build_object('id', s.id, 'sectorName', s.sector_name, 'createdAt', s.created_at, 'disabledAt', s.disabled_at)) FILTER (WHERE s.id IS NOT NULL) AS sectors
            FROM farms f
                JOIN companies c ON f.company_id = c.id
                LEFT JOIN sectors s 
                    ON s.farm_id = f.id 
                    AND s.created_at < :timeFilterTo 
                    AND (s.disabled_at > :timeFilterFrom OR s.disabled_at IS NULL)
                LEFT JOIN (SELECT DISTINCT company_id, farm_id, sector_id FROM master_data_permits 
                    WHERE user_id = :userId) p ON 
                    p.company_id = c.id
                    AND p.farm_id = f.id
                    AND p.sector_id IS NOT DISTINCT FROM s.id
            WHERE f.id = :farmId AND (
                :isAdmin = true
                OR p.farm_id IS NOT NULL
            )
            GROUP BY c.id, c.company_name, f.id, f.farm_name, f.location`

            const results = await this.sequelize.query(query, {
                replacements: { userId, farmId, isAdmin, timeFilterFrom, timeFilterTo },
                type: this.sequelize.QueryTypes.SELECT
            });
            return results?.[0];
        } catch (error) {
            throw new Error(`Error retrieving farm details: ${error.message}`);
        }
    }

    async getFarmsByCompany(companyId) {
        return await this.Farm.findAll({
            where: {
                companyId: companyId
            }
        })
    }

    async updateFarm(farmId, updates) {
        try {
            const farm = await this.Farm.findByPk(farmId);
            if (!farm) throw new Error("Farm not found");
            const { name, location } = updates
            return await farm.update({ farmName: name, location: location });
        } catch (error) {
            throw new Error(`Error while updating farm caused by: ${error.message}`);
        }
    }

    async disableFarm(farmId, timestamp) {
        try {
            await this.Farm.update(
                { disabledAt: timestamp },
                { where: { id: farmId, disabledAt: { [Op.is]: null } } }
            );
        } catch (error) {
            throw new Error(`Error while disabling farm caused by: ${error.message}`);
        }
    }

    async deleteFarm(farmId) {
        try {
            return await _deleteFromModelByParams(this.Farm, { id: farmId })
        } catch (error) {
            throw new Error(`Error deleting farm: ${error.message}`);
        }
    }
}

export default FarmRepository
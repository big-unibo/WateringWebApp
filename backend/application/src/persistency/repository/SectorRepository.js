import { Op} from 'sequelize';
import { _deleteFromModelByParams } from '../../commons/repositoryUtils.js';

class SectorRepository {

    constructor(models, sequelize) {
        this.Company = models.Company
        this.Farm = models.Farm
        this.Sector = models.Sector
        this.Thesis = models.Thesis
        this.ThesisInSector = models.ThesisInSector
        this.sequelize = sequelize
    }

    async sectorExists(sectorId) {
        const count = await this.Sector.count({
            where: { id: sectorId }
        });
        return count > 0;
    }

    async createSector({
        name,
        farmId,
        culture,
        cultureType,
        location,
        dripperCapacity,
        sprinklerCapacity,
        doubleWing,
        createdAt
    }) {
        try {
            const farm = await this.Farm.findByPk(farmId);
            if (!farm) {
                throw new Error(`Farm with ID ${farmId} does not exist.`);
            }
            const sectorCreated = await this.Sector.create({
                sectorName: name,
                farmId,
                culture,
                cultureType,
                location,
                dripperCapacity,
                sprinklerCapacity,
                doubleWing,
                createdAt
            });

            return sectorCreated;
        } catch (error) {
            throw new Error(`Error creating new sector caused by: ${error.message}`);
        }
    }

    async getSectorDetails(sectorId, timeFilterFrom, timeFilterTo) {
        const sector = await this.Sector.findByPk(sectorId, {
            attributes: ['id', 'sectorName', 'culture', 'cultureType', 'farmId', 'location', 'dripperCapacity', 'sprinklerCapacity', 'doubleWing', 'createdAt', 'disabledAt'],
            include: [
                {
                    model: this.Farm,
                    as: 'farm',
                    attributes: ['farmName', 'location', 'companyId'],
                    include: [
                        {
                            model: this.Company,
                            as: 'company',
                            attributes: ['companyName'],
                        }
                    ]
                },
                {
                    model: this.ThesisInSector,
                    as: 'thesisInSector',
                    attributes: ['thesisId'],
                    required: false,
                    include: [
                        {
                            model: this.Thesis,
                            as: 'thesis',
                            attributes: ['thesisName']
                        }
                    ],
                    where: {
                        validFrom: { [Op.lt]: timeFilterTo },
                        validTo: {
                            [Op.or]: [
                                { [Op.is]: null },
                                { [Op.gt]: timeFilterFrom }
                            ]
                        }
                    }
                }
            ]
        });

        if (!sector) throw new Error(`Sector with id ${sectorId} not found`);
        return sector.toJSON();
    }

    async getSectors(filteringIds, timeFilterFrom, timeFilterTo) {

        let timeConditions = "";
        const replacements = { filteringIds };

        if (timeFilterTo) {
            timeConditions += ` AND (ts.valid_from IS NULL OR ts.valid_from <= :timeFilterTo)`;
            replacements.timeFilterTo = timeFilterTo;
        }

        if (timeFilterFrom) {
            timeConditions += ` AND (ts.valid_to IS NULL OR ts.valid_to >= :timeFilterFrom)`;
            replacements.timeFilterFrom = timeFilterFrom;
        }

        const query = `
            SELECT DISTINCT c.id AS "companyId",
                c.company_name AS "companyName",
                f.id AS "farmId",
                f.farm_name AS "farmName",
                s.id AS "sectorId",
                s.sector_name AS "sectorName",
                s.culture AS "culture",
                s.culture_type AS "cultureType",
                s.location AS "location",
                s.created_at AS "createdAt",
                s.disabled_at AS "disabledAt"
            FROM sectors s
            JOIN farms f
                ON f.id = s.farm_id
            JOIN companies c
                ON c.id = f.company_id
            LEFT JOIN theses_in_sectors ts
                ON ts.sector_id = s.id
                ${timeConditions}
            WHERE ${filteringIds === null
                ? 'TRUE'
                : filteringIds.length === 0
                    ? 'FALSE'
                    : 's.id = ANY(ARRAY[:filteringIds])'}
                AND s.created_at < :timeFilterTo
                AND (s.disabled_at > :timeFilterFrom OR s.disabled_at IS NULL)
            ORDER BY "companyName", "farmName", "sectorName";
        `;

        const results = await this.sequelize.query(query, {
            replacements: replacements,
            type: this.sequelize.QueryTypes.SELECT
        });

        return results;
    }

    async getSectorsByFarm(farmId){
        return await this.Sector.findAll({
            where: {
                farmId: farmId
            }
        })
    }

    async updateSector(sectorId, updates) {
        try {
            const sector = await this.Sector.findByPk(sectorId);
            if (!sector) throw new Error("Sector not found");
            const { name, culture, cultureType, location, dripperCapacity, sprinklerCapacity, doubleWing } = updates
            return await sector.update({ sectorName: name, culture, cultureType, location, dripperCapacity, sprinklerCapacity, doubleWing });
        } catch (error) {
            throw new Error(`Error while updating sector caused by: ${error.message}`);
        }
    }

    async disableSector(sectorId, validTo) {
        try {
            await this.Sector.update(
                { disabledAt: validTo },
                { where: { id: sectorId, disabledAt: { [Op.is]: null } } }
            );
        } catch (error) {
            throw new Error(`Error while disabling sector caused by: ${error.message}`);
        }
    }


    async deleteSector(sectorId) {
        try {
            return await _deleteFromModelByParams(this.Sector, { id: sectorId })
        } catch (error) {
            throw new Error(`Error deleting sector: ${error.message}`);
        }
    }

}

export default SectorRepository
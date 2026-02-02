import { Op} from 'sequelize';

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
        doubleWing
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
                doubleWing
            });

            return sectorCreated;
        } catch (error) {
            throw new Error(`Error creating new sector caused by: ${error.message}`);
        }
    }

    async getSectorDetails(sectorId, timestamp) {
        const sector = await this.Sector.findByPk(sectorId, {
            attributes: ['id', 'sectorName', 'culture', 'cultureType', 'farmId', 'location', 'dripperCapacity', 'sprinklerCapacity', 'doubleWing'],
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
                    required: timestamp ? true : false,
                    include: [
                        {
                            model: this.Thesis,
                            as: 'thesis',
                            attributes: ['thesisName']
                        }
                    ],
                    where: timestamp ? {
                        validFrom: { [Op.lt]: timestamp },
                        validTo: {
                            [Op.or]: [
                                { [Op.is]: null },
                                { [Op.gt]: timestamp }
                            ]
                        }
                    } : undefined 
                }
            ]
        });

        if (!sector) throw new Error(`Sector with id ${sectorId} not found`);
        return sector.toJSON();
    }

    async getSectors(userId, timeFilterFrom, timeFilterTo) {

        let timeConditions = "";
        const replacements = { userId };

        if (timeFilterTo) {
            timeConditions += ` AND ts.valid_from <= :timeFilterTo`;
            replacements.timeFilterTo = timeFilterTo;
        }

        if (timeFilterFrom) {
            timeConditions += ` AND (ts.valid_to IS NULL OR ts.valid_to >= :timeFilterFrom)`;
            replacements.timeFilterFrom = timeFilterFrom;
        }

        const query = `
            SELECT DISTINCT
                c.id AS "companyId",
                c.company_name AS "companyName",
                f.id AS "farmId",
                f.farm_name AS "farmName",
                s.id AS "sectorId",
                s.sector_name AS "sectorName",
                s.culture AS "culture",
                s.culture_type AS "cultureType",
                s.location AS "location"
            FROM sectors s
            JOIN farms f
                ON f.id = s.farm_id
            JOIN companies c
                ON c.id = f.company_id
            JOIN users u
                ON u.id = :userId 
            LEFT JOIN permits p
                ON p.id_key = s.id 
                AND p.table = 'sectors'
            LEFT JOIN theses_in_sectors ts
                ON ts.sector_id = s.id
            WHERE 
                (
                    (p.user_id = :userId) 
                )
                ${timeConditions}
            ORDER BY "companyName", "farmName", "sectorName";
        `;

        const results = await this.sequelize.query(query, {
            replacements: replacements,
            type: this.sequelize.QueryTypes.SELECT
        });

        return results;
    }

}

export default SectorRepository
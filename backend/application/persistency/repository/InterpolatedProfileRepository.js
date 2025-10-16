import { QueryTypes, Op } from 'sequelize'

class InterpolatedProfileRepository {

    constructor(models, sequelize){
        this.Company = models.Company;
        this.Field = models.Field;
        this.Sector = models.Sector;
        this.Thesis = models.Thesis;
        this.ThesisInSector = models.ThesisInSector;
        this.sequelize = sequelize;
    }

    async getInterpolatedProfiles(thesisId, timeFilterFrom, timeFilterTo) {

        const query = `
            WITH validity_table AS (
                SELECT
                    tas."thesis_name",
                    tas."device_id",
                    tas."valid_from",
                    tas."valid_to"
                FROM theses_all_signals tas
                WHERE tas."device_type" = 'GRID'
                GROUP BY 
                    tas."thesis_name",
                    tas."device_id",
                    tas."valid_from",
                    tas."valid_to"
            )
            SELECT DISTINCT
                v."thesis_name" as "thesisName",
                v."device_id" as "deviceId",
                ip."timestamp" as "timestamp",
                ip."x" as "x", 
                ip."y" as "y",
                ip."z" as "z",
                ip."value" as "value"
            FROM validity_table v
            JOIN interpolated_profiles ip 
                ON ip.profile_id = v.device_id
                AND ip.timestamp >= v.valid_from
                AND (v.valid_to IS NULL OR ip.timestamp <= v.valid_to)
                AND ip.timestamp BETWEEN :timeFilterFrom AND :timeFilterTo
                AND ip.value BETWEEN -10000000 AND 0
            `;

        const results = await this.sequelize.query(query, {
            replacements: {
                timeFilterFrom,
                timeFilterTo,
                thesisId
            },
            type: QueryTypes.SELECT
        });  

        return results;
    }
}

export default InterpolatedProfileRepository
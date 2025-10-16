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
                SELECT DISTINCT
                    tas.thesis_name,
                    tas.device_id,
                    tas.valid_from,
                    tas.valid_to
                FROM theses_all_signals tas
                WHERE tas.device_type = 'GRID'
                AND tas.thesis_id = :thesisId
            )
            SELECT DISTINCT
                v.thesis_name AS "thesisName",
                v.device_id AS "deviceId",
                ip.timestamp AS "timestamp",
                ip.x AS "x",
                ip.y AS "y",
                ip.z AS "z",
                ip.value AS "value"
            FROM validity_table v
            JOIN interpolated_profiles ip 
                ON ip.profile_id = v.device_id
                AND ip.timestamp BETWEEN 
                    GREATEST(v.valid_from, :timeFilterFrom)
                    AND LEAST(COALESCE(v.valid_to, 'infinity'), :timeFilterTo)
            ORDER BY ip.timestamp ASC;
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
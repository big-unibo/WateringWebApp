import { QueryTypes, Op } from 'sequelize'

const HUMIDITY_DEVICE_TYPE = 'SOIL_MOISTURE_GRID'

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
                    tas.device_binning_id,
                    tas.valid_from,
                    tas.valid_to
                FROM theses_all_signals tas
                WHERE tas.device_type = :HUMIDITY_DEVICE_TYPE
                AND tas.thesis_id = :thesisId
            )
            SELECT DISTINCT
                v.thesis_name AS "thesisName",
                v.device_id AS "deviceId",
                v.device_binning_id AS "binningId",
                ip.timestamp AS "timestamp",
                ip.x AS "x",
                ip.y AS "y",
                ip.z AS "z",
                ip.value AS "value"
            FROM validity_table v
            JOIN interpolated_profiles ip 
                ON ip.grid_id = v.device_id
                AND ip.timestamp BETWEEN 
                    GREATEST(v.valid_from, :timeFilterFrom)
                    AND LEAST(COALESCE(v.valid_to, 'infinity'), :timeFilterTo)
            ORDER BY ip.timestamp ASC;
        `;


        const results = await this.sequelize.query(query, {
            replacements: {
                timeFilterFrom,
                timeFilterTo,
                thesisId,
                HUMIDITY_DEVICE_TYPE
            },
            type: QueryTypes.SELECT
        });  

        return results;
    }
}

export default InterpolatedProfileRepository
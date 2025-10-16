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

    async getInterpolatedProfiles(thesisId, deviceId, timeFilterFrom, timeFilterTo) {
        const query = `
            SELECT
                tas."thesis_name" AS "thesisName",
                tas."device_id" AS "deviceId",
                ip."x" as x,
                ip."y" as y,
                ip."z" as z,
                ip."value" as value,
                ip."timestamp" as timestamp
            FROM theses_all_signals tas
            JOIN interpolated_profiles ip
                ON ip."profile_id" = tas."device_id"
                AND ip."timestamp" >= tas."valid_from"
                AND (tas."valid_to" IS NULL OR ip."timestamp" <= tas."valid_to")
            WHERE ip."timestamp" BETWEEN :timeFilterFrom AND :timeFilterTo
                AND tas."device_id" = :deviceId
                AND tas."thesis_id" = :thesisId
        `;

        const results = await this.sequelize.query(query, {
        replacements: {
            timeFilterFrom,
            timeFilterTo,
            deviceId,
            thesisId
        },
            type: QueryTypes.SELECT
        });      
        return results;
    }

}

export default InterpolatedProfileRepository
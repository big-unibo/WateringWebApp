import { QueryTypes } from 'sequelize';

class WateringAdviceRepository {

    constructor(sequelize) {
        this.sequelize = sequelize
    }

    async getLastWateringAdvice(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp) {

        const query = `
            SELECT "source", "refStructureName", "companyName", "fieldName", "sectorName", "thesisName", "advice", "advice_timestamp" as "profile_timestamp", "duration", "watering_start", "watering_end", "r", "ki", "kp", "delta" AS "lastIrrigation"
            FROM
                watering_schedule 
            WHERE 	"source" = 'iFarming' AND
                    "refStructureName" = '${refStructureName}' AND
                    "companyName" = '${companyName}' AND
                    "fieldName" = '${fieldName}' AND
                    "sectorName" = '${sectorName}' AND
                    "thesisName" = '${thesisName}' AND
                    "advice_timestamp" = (
                        SELECT MAX(advice_timestamp) FROM watering_schedule
                        WHERE "latest" = true AND 
                            "deleted" = false AND 
                            "source" = 'iFarming' AND
                            "refStructureName" = '${refStructureName}' AND
                            "companyName" = '${companyName}' AND
                            "fieldName" = '${fieldName}' AND
                            "sectorName" = '${sectorName}' AND
                            "thesisName" = '${thesisName}' AND
                            "advice_timestamp" < ${timestamp}
                    )
            ORDER BY "watering_start" DESC
            LIMIT 1
            `

        return await this.sequelize.query(query, {
            type: QueryTypes.SELECT,
            bind: {
                refStructureName,
                companyName,
                fieldName,
                sectorName,
                thesisName,
                timestamp
            }
        });
    }    
}

export default WateringAdviceRepository;
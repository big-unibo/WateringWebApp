import { WateringAdviceWrapper } from '../querywrappers/WateringAdviceWrapper.js';
import { QueryTypes } from "sequelize";

class WateringAdviceRepository {

    constructor(sequelize) {
        this.sequelize = sequelize;
    }

    async findWaterAdvice(timefilterFrom, timefilterTo, refStructureName, companyName, fieldName, sectorName, plantRow) {

        const queryString = `
            SELECT DISTINCT "source",
                            "refStructureName",
                            "companyName",
                            "fieldName",
                            "detectedValueTypeDescription",
                            "sectorName",
                            "plantRow",
                            MAX("value") as value, rounded_timestamp
            FROM (
                (
                SELECT DISTINCT "source", "refStructureName", "companyName", "fieldName", 'Pluv Curr (mm)' "detectedValueTypeDescription", "sectorName", "plantRow", SUM ("value") as value, ((3600*24) * (timestamp / (3600*24)):: INT) as rounded_timestamp
                FROM view_data_original
                WHERE "detectedValueTypeId" IN ('PLUV_CURR')
                AND "timestamp" >= '${timefilterFrom}'
                AND "timestamp" <= '${timefilterTo}'
                AND "refStructureName" = '${refStructureName}'
                AND "companyName" = '${companyName}'
                AND "fieldName" = '${fieldName}'
                AND "sectorName" = '${sectorName}'
                AND "plantRow" = '${plantRow}'
                GROUP BY "source", "refStructureName", "companyName", "fieldName", "detectedValueTypeDescription", "sectorName", "plantRow", rounded_timestamp
                ORDER BY rounded_timestamp ASC
                )
            UNION
            (SELECT DISTINCT "source", 
                            "refStructureName",
                            "companyName",
                            "fieldName",
                            'Dripper (L)' as "detectedValueTypeDescription",
                            "sectorName",
                            "plantRow",
                            SUM("value") as value, ((3600*24) * (timestamp / (3600*24))::INT) as rounded_timestamp
            FROM view_data_original
            WHERE "detectedValueTypeId" IN ('DRIPPER')
              AND "timestamp" >= '${timefilterFrom}'
              AND "timestamp" <= '${timefilterTo}'
              AND "refStructureName" = '${refStructureName}'
              AND "companyName" = '${companyName}'
              AND "fieldName" = '${fieldName}'
              AND "sectorName" = '${sectorName}'
              AND "plantRow" = '${plantRow}'
            GROUP BY "source", "refStructureName", "companyName", "fieldName", "detectedValueTypeDescription", "sectorName", "plantRow", rounded_timestamp
            ORDER BY rounded_timestamp ASC)
            UNION            
            (SELECT DISTINCT "source", 
                            "refStructureName",
                            "companyName",
                            "fieldName",
                            'Sprinkler (L)' as "detectedValueTypeDescription",
                            "sectorName",
                            "plantRow",
                            SUM("value") as value, ((3600*24) * (timestamp / (3600*24))::INT) as rounded_timestamp
            FROM view_data_original
            WHERE "detectedValueTypeId" IN ('SPRINKLER')
              AND "timestamp" >= '${timefilterFrom}'
              AND "timestamp" <= '${timefilterTo}'
              AND "refStructureName" = '${refStructureName}'
              AND "companyName" = '${companyName}'
              AND "fieldName" = '${fieldName}'
              AND "sectorName" = '${sectorName}'
              AND "plantRow" = '${plantRow}'
            GROUP BY "source", "refStructureName", "companyName", "fieldName", "detectedValueTypeDescription", "sectorName", "plantRow", rounded_timestamp
            ORDER BY rounded_timestamp ASC)
            UNION
            (SELECT DISTINCT "source", 
                            "refStructureName",
                            "companyName",
                            "fieldName",
                            'Pot Evap (mm)' AS "detectedValueTypeDescription",
                            "sectorName",
                            "plantRow",
                            AVG(-"value") as value,
                  ((3600*24) * (timestamp / (3600*24))::INT + (3600*24)) as rounded_timestamp
            FROM view_data_original
            WHERE "detectedValueTypeId" IN ('ET0')
              AND "timestamp" >= '${timefilterFrom}' - (3600*24)
              AND "timestamp" <= '${timefilterTo}'
              AND "refStructureName" = '${refStructureName}'
              AND "companyName" = '${companyName}'
              AND "fieldName" = '${fieldName}'
              AND "sectorName" = '${sectorName}'
              AND "plantRow" = '${plantRow}'
            GROUP BY "source", "refStructureName", "companyName", "fieldName", "detectedValueTypeDescription", "sectorName", "plantRow", rounded_timestamp
            ORDER BY rounded_timestamp ASC)
            UNION
            (SELECT DISTINCT "source", 
                            "refStructureName",
                            "companyName",
                            "fieldName",
                            'Advice (L)' as "detectedValueTypeDescription",
                            "sectorName",
                            "plantRow",
                            AVG("advice") as value,
                            ((3600*24) * (watering_start / (3600*24))::INT) as rounded_timestamp
            FROM watering_schedule
            WHERE "watering_start" >= '${timefilterFrom}'
              AND "watering_start" < '${timefilterTo}'
              AND "refStructureName" = '${refStructureName}'
              AND "companyName" = '${companyName}'
              AND "fieldName" = '${fieldName}'
              AND "sectorName" = '${sectorName}'
              AND "plantRow" = '${plantRow}'
              AND "latest" = true
            GROUP BY "source", "refStructureName", "companyName", "fieldName", "detectedValueTypeDescription", "sectorName", "plantRow", rounded_timestamp
            ORDER BY rounded_timestamp ASC)
            UNION
            (SELECT DISTINCT "source",
                            "refStructureName",
                            "companyName",
                            "fieldName",
                            'Expected Water (L)' as "detectedValueTypeDescription",
                            "sectorName",
                            "plantRow",
                            "expected_water" as value,
                            ((3600*24) * (watering_start / (3600*24))::INT) as rounded_timestamp
            FROM watering_schedule
            WHERE "watering_start" >= '${timefilterFrom}'
              AND "watering_start" < '${timefilterTo}'
              AND "latest" = true
              AND "refStructureName" = '${refStructureName}'
              AND "companyName" = '${companyName}'
              AND "fieldName" = '${fieldName}'
              AND "sectorName" = '${sectorName}'
              AND "plantRow" = '${plantRow}'
            GROUP BY "source", "refStructureName", "companyName", "fieldName", "detectedValueTypeDescription", "expected_water", "sectorName", "plantRow", rounded_timestamp
            ORDER BY rounded_timestamp ASC)
                ) A
            GROUP BY "source", "refStructureName", "companyName", "fieldName", "detectedValueTypeDescription", "sectorName", "plantRow", rounded_timestamp
            ORDER BY rounded_timestamp ASC, "detectedValueTypeDescription" ASC
        `;

        const results = await this.sequelize.query(queryString, {
            type: QueryTypes.SELECT,
            bind: {
                timefilterFrom,
                timefilterTo,
                refStructureName,
                companyName,
                fieldName,
                sectorName,
                plantRow
            }
        });

        return results.map(result => new WateringAdviceWrapper(
            result.refStructureName,
            result.companyName,
            result.fieldName,
            result.detectedValueTypeDescription,
            result.sectorName,
            result.plantRow,
            result.value,
            result.rounded_timestamp
        ));
    }

}

export default WateringAdviceRepository;
import { WateringAggregateWrapper } from '../querywrappers/WateringAggregateWrapper.js';
import { QueryTypes } from "sequelize";

class WateringAggregateRepository {

    constructor(sequelize) {
        this.sequelize = sequelize;
    }

    async findWaterAggregate(timefilterFrom, timefilterTo, refStructureName, companyName, fieldName, sectorName, plantRow) {

        const queryString = `
            SELECT DISTINCT "source",
                            "refStructureName",
                            "companyName",
                            "fieldName",
                            "detectedValueTypeDescription",
                            "sectorName",
                            "plantRow",
                            MAX("value") as value, timestamp
            FROM (
                (
                SELECT DISTINCT "source", "refStructureName", "companyName", "fieldName", 'Pluv Curr (mm)' "detectedValueTypeDescription", "sectorName", "plantRow", SUM ("value") as value, EXTRACT(EPOCH FROM date_trunc('day', to_timestamp(timestamp))) as timestamp
                FROM view_data_original
                WHERE "detectedValueTypeId" IN ('PLUV_CURR')
                AND "timestamp" >= '${timefilterFrom}'
                AND "timestamp" <= '${timefilterTo}'
                AND "source" = 'iFarming'
                AND "refStructureName" = '${refStructureName}'
                AND "companyName" = '${companyName}'
                AND "fieldName" = '${fieldName}'
                AND "sectorName" = '${sectorName}'
                AND "plantRow" = '${plantRow}'
                GROUP BY "source", "refStructureName", "companyName", "fieldName", "detectedValueTypeDescription", "sectorName", "plantRow", timestamp
                ORDER BY timestamp ASC
                )
            UNION
            (SELECT DISTINCT vdo."source", 
                            vdo."refStructureName",
                            vdo."companyName",
                            vdo."fieldName",
                            'Dripper (L)' as "detectedValueTypeDescription",
                            vdo."sectorName",
                            vdo."plantRow",
                            SUM(vdo."value" * COALESCE(ws."dripper_scaling_factor",1)) as value, 
                            EXTRACT(EPOCH FROM date_trunc('day', to_timestamp(vdo.timestamp))) as timestamp
            FROM view_data_original AS vdo
            LEFT JOIN watering_sector AS ws 
              ON vdo."source" = ws."source"
              AND vdo."refStructureName" = ws."refStructureName"
              AND vdo."companyName" = ws."companyName"
              AND vdo."fieldName" = ws."fieldName"
              AND vdo."sectorName" = ws."sectorName"
              AND vdo."timestamp" >= ws."timestamp_from"
              AND (ws."timestamp_to" IS NULL OR vdo."timestamp" <= ws."timestamp_to")
            WHERE vdo."detectedValueTypeId" IN ('DRIPPER')
              AND vdo."timestamp" >= '${timefilterFrom}'
              AND vdo."timestamp" <= '${timefilterTo}'
              AND vdo."source" = 'iFarming'
              AND vdo."refStructureName" = '${refStructureName}'
              AND vdo."companyName" = '${companyName}'
              AND vdo."fieldName" = '${fieldName}'
              AND vdo."sectorName" = '${sectorName}'
              AND vdo."plantRow" = '${plantRow}'
            GROUP BY vdo."source", vdo."refStructureName", vdo."companyName", vdo."fieldName", "detectedValueTypeDescription", vdo."sectorName", vdo."plantRow", timestamp
            ORDER BY timestamp ASC)
            UNION            
            (SELECT DISTINCT "source", 
                            "refStructureName",
                            "companyName",
                            "fieldName",
                            'Sprinkler (L)' as "detectedValueTypeDescription",
                            "sectorName",
                            "plantRow",
                            SUM("value") as value, 
                            EXTRACT(EPOCH FROM date_trunc('day', to_timestamp(timestamp))) as timestamp
            FROM view_data_original
            WHERE "detectedValueTypeId" IN ('SPRINKLER')
              AND "timestamp" >= '${timefilterFrom}'
              AND "timestamp" <= '${timefilterTo}'
              AND "source" = 'iFarming'
              AND "refStructureName" = '${refStructureName}'
              AND "companyName" = '${companyName}'
              AND "fieldName" = '${fieldName}'
              AND "sectorName" = '${sectorName}'
              AND "plantRow" = '${plantRow}'
            GROUP BY "source", "refStructureName", "companyName", "fieldName", "detectedValueTypeDescription", "sectorName", "plantRow", timestamp
            ORDER BY timestamp ASC)
            UNION
            (SELECT DISTINCT "source", 
                            "refStructureName",
                            "companyName",
                            "fieldName",
                            'Pot Evap (mm)' AS "detectedValueTypeDescription",
                            "sectorName",
                            "plantRow",
                            AVG(-"value") as value,
                            EXTRACT(EPOCH FROM date_trunc('day', to_timestamp(timestamp))) as timestamp
            FROM view_data_original
            WHERE "detectedValueTypeId" IN ('ET0')
              AND "timestamp" >= '${timefilterFrom}'
              AND "timestamp" <= '${timefilterTo}'
              AND "source" = 'iFarming'
              AND "refStructureName" = '${refStructureName}'
              AND "companyName" = '${companyName}'
              AND "fieldName" = '${fieldName}'
              AND "sectorName" = '${sectorName}'
              AND "plantRow" = '${plantRow}'
            GROUP BY "source", "refStructureName", "companyName", "fieldName", "detectedValueTypeDescription", "sectorName", "plantRow", timestamp
            ORDER BY timestamp ASC)
            UNION
            (SELECT DISTINCT "source", 
                            "refStructureName",
                            "companyName",
                            "fieldName",
                            'Advice (L)' as "detectedValueTypeDescription",
                            "sectorName",
                            "plantRow",
                            AVG("advice") as value,
                            EXTRACT(EPOCH FROM date_trunc('day', to_timestamp(watering_start))) as timestamp
            FROM watering_schedule
            WHERE "watering_start" >= '${timefilterFrom}'
              AND "watering_start" < '${timefilterTo}'
              AND "source" = 'iFarming'
              AND "refStructureName" = '${refStructureName}'
              AND "companyName" = '${companyName}'
              AND "fieldName" = '${fieldName}'
              AND "sectorName" = '${sectorName}'
              AND "plantRow" = '${plantRow}'
              AND "latest" = true
            GROUP BY "source", "refStructureName", "companyName", "fieldName", "detectedValueTypeDescription", "sectorName", "plantRow", timestamp
            ORDER BY timestamp ASC)
            UNION
            (SELECT DISTINCT "source",
                            "refStructureName",
                            "companyName",
                            "fieldName",
                            'Expected Water (L)' as "detectedValueTypeDescription",
                            "sectorName",
                            "plantRow",
                            "expected_water" as value,
                            EXTRACT(EPOCH FROM date_trunc('day', to_timestamp(watering_start))) as timestamp
            FROM watering_schedule
            WHERE "watering_start" >= '${timefilterFrom}'
              AND "watering_start" < '${timefilterTo}'
              AND "latest" = true
              AND "source" = 'iFarming'
              AND "refStructureName" = '${refStructureName}'
              AND "companyName" = '${companyName}'
              AND "fieldName" = '${fieldName}'
              AND "sectorName" = '${sectorName}'
              AND "plantRow" = '${plantRow}'
            GROUP BY "source", "refStructureName", "companyName", "fieldName", "detectedValueTypeDescription", "expected_water", "sectorName", "plantRow", timestamp
            ORDER BY timestamp ASC)
                ) A
            GROUP BY "source", "refStructureName", "companyName", "fieldName", "detectedValueTypeDescription", "sectorName", "plantRow", timestamp
            ORDER BY timestamp ASC, "detectedValueTypeDescription" ASC
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

        return results.map(result => new WateringAggregateWrapper(
            result.refStructureName,
            result.companyName,
            result.fieldName,
            result.detectedValueTypeDescription,
            result.sectorName,
            result.plantRow,
            result.value,
            result.timestamp
        ));
    }

}

export default WateringAggregateRepository;
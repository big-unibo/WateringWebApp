import { DeltaWrapper } from '../querywrappers/DeltaWrapper.js';
import { QueryTypes } from "sequelize";

class DeltaRepository {

    constructor(sequelize) {
        this.sequelize = sequelize;
    }

    async findDelta(timestampFrom, timestampTo, refStructureName, companyName, fieldName, sectorName, plantRow) {

        const queryString = `
            SELECT q1."source",
                   q1."refStructureName",
                   q1."companyName",
                   q1."fieldName",
                   q1."sectorName",
                   q1."plantRow",
                   AVG("value") as "value",
                   EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(q1."timestamp"))) ::INT AS timestamp, 
             'Media Pot. Idr. Giornaliera' as "detectedValueTypeDescription"
            FROM (
                SELECT di."source", di."refStructureName", di."companyName", di."fieldName", di."sectorName", di."plantRow", di."timestamp" AS interpolated_timestamp, AVG (CASE WHEN di."value" > -300 THEN LN(ABS(di."value")) * weighted."weight"
                ELSE LN(ABS(-300)) * weighted."weight" END) as "value", di."xx", di."yy", wa."watering_start" AS timestamp
                FROM data_interpolated as di
                JOIN (
                        SELECT "source", "refStructureName", "companyName", "fieldName", "sectorName", "plantRow", "xx", "yy", "weight", fi."matrixId", "timestamp_from", "timestamp_to"
                        FROM field_matrix as fi
                        JOIN matrix_profile as mp ON fi."matrixId" = mp."matrixId"
                        WHERE "refStructureName" = '${refStructureName}'
                        AND "companyName" = '${companyName}'
                        AND "fieldName" = '${fieldName}'
                        AND "sectorName" = '${sectorName}'
                        AND "plantRow" = '${plantRow}'
                        AND "timestamp_from" < '${parseInt(timestampTo)}' 
                        AND ("timestamp_to" > '${parseInt(timestampFrom)}' OR "timestamp_to" IS NULL)
                    ) as weighted 
                    ON weighted."source" = di."source"
                        AND weighted."refStructureName" = di."refStructureName"
                        AND weighted."companyName" = di."companyName"
                        AND weighted."fieldName" = di."fieldName"
                        AND weighted."sectorName" = di."sectorName"
                        AND weighted."plantRow" = di."plantRow"
                        AND weighted."xx" = di."xx"
                        AND weighted."yy" = di."yy"
                        AND di."timestamp" > weighted."timestamp_from" AND (di."timestamp" < weighted."timestamp_to" OR weighted."timestamp_to" IS NULL)
                JOIN (
                    SELECT (("advice_timestamp" / 3600)::INT * 3600) AS timestamp, "watering_start"
                    FROM watering_schedule
                    WHERE latest = true
                        AND "watering_start" BETWEEN '${timestampFrom}' AND '${timestampTo}'
                        AND "refStructureName" = '${refStructureName}'
                        AND "companyName" = '${companyName}'
                        AND "fieldName" = '${fieldName}'
                        AND "sectorName" = '${sectorName}'
                        AND "plantRow" = '${plantRow}'
                    ) as wa 
                    ON wa."timestamp"  = di."timestamp"
                WHERE di."refStructureName" = '${refStructureName}'
                    AND di."companyName" = '${companyName}'
                    AND di."fieldName" = '${fieldName}'
                    AND di."sectorName" = '${sectorName}'
                    AND di."plantRow" = '${plantRow}'
                    AND wa."timestamp" BETWEEN '${timestampFrom}' AND '${timestampTo}'
                GROUP BY di."source", di."refStructureName", di."companyName", di."fieldName", di."sectorName", di."plantRow", di."timestamp", di."xx", di."yy", wa."watering_start"
                ) as q1
            GROUP BY q1."source", q1."refStructureName", q1."companyName", q1."fieldName", q1."sectorName", q1."plantRow", q1."timestamp"
            UNION
            (
            SELECT sq1."source", sq1."refStructureName", sq1."companyName", sq1."fieldName", sq1."sectorName", sq1."plantRow", "value", EXTRACT (EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(sq2."timestamp"))):: INT AS timestamp, 'Media Pot. Idr. Ottimale' as "detectedValueTypeDescription"
            FROM (
                SELECT "source", "refStructureName", "companyName", "fieldName", "sectorName", "plantRow", ROUND(AVG (CASE WHEN "optValue" > -300 THEN LN(ABS("optValue")) * "weight"
                ELSE LN(ABS(-300)) * "weight" END):: numeric, 6) as "value", fm."matrixId", "timestamp_from", "timestamp_to"
                FROM field_matrix as fm
                JOIN matrix_profile as mp ON fm."matrixId" = mp."matrixId"
                WHERE "refStructureName" = '${refStructureName}'
                AND "companyName" = '${companyName}'
                AND "fieldName" = '${fieldName}'
                AND "sectorName" = '${sectorName}'
                AND "plantRow" = '${plantRow}'
                AND "timestamp_from" < '${parseInt(timestampTo)}' 
                AND ("timestamp_to" > '${parseInt(timestampFrom)}' OR "timestamp_to" IS NULL)
                AND (mp.xx, mp.yy) IN (
                    SELECT DISTINCT xx, yy
                    FROM data_interpolated
                    WHERE "refStructureName" = '${refStructureName}'
                    AND "companyName" = '${companyName}'
                    AND "fieldName" = '${fieldName}'
                    AND "sectorName" = '${sectorName}'
                    AND "plantRow" = '${plantRow}'
                    AND timestamp BETWEEN '${timestampFrom}' AND '${timestampTo}'
                )
                GROUP BY "source", "refStructureName", "companyName", "fieldName", "sectorName", "plantRow", fm."matrixId", "timestamp_from", "timestamp_to"
                ) as sq1
                JOIN (
                    SELECT "watering_start" AS timestamp
                    FROM watering_schedule
                    WHERE latest = true
                        AND "watering_start" BETWEEN '${timestampFrom}' AND '${timestampTo}'
                        AND "refStructureName" = '${refStructureName}'
                        AND "companyName" = '${companyName}'
                        AND "fieldName" = '${fieldName}'
                        AND "sectorName" = '${sectorName}'
                        AND "plantRow" = '${plantRow}'
                    ) as sq2
                ON "timestamp" > "timestamp_from" AND ("timestamp" < "timestamp_to" OR "timestamp_to" IS NULL)
            )
            ORDER BY "timestamp" DESC
        `;

        const results = await this.sequelize.query(queryString, {
           type: QueryTypes.SELECT,
           bind: {
               timestampFrom,
               timestampTo,
               refStructureName,
               companyName,
               fieldName,
               sectorName,
               plantRow
           }
        });

        return results.map(result => new DeltaWrapper(
            result.refStructureName,
            result.companyName,
            result.fieldName,
            result.sectorName,
            result.plantRow,
            result.value,
            result.timestamp,
            result.detectedValueTypeDescription
        ));
    }

    async findPunctualDelta(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp) {

        const queryString = `
            SELECT q1."source",
                    q1."refStructureName",
                   q1."companyName",
                   q1."fieldName",
                   q1."sectorName",
                   q1."plantRow",
                   q1.xx,
                   q1.yy,
                   q1."value" - q2."value" as distance,
                   q1."timestamp"
            FROM (
                SELECT di."source", di."refStructureName", di."companyName", di."fieldName", di."sectorName", di."plantRow", di."timestamp", (CASE WHEN di."value" > -300 THEN LN(ABS(di."value")) * weighted."weight"
                ELSE LN(ABS(-300)) * weighted."weight" END) as "value", di."xx", di."yy"
                FROM data_interpolated as di
                JOIN (
                    SELECT "source", "refStructureName", "companyName", "fieldName", "sectorName", "plantRow", "xx", "yy", "weight"
                    FROM field_matrix as fi
                    JOIN matrix_profile as mp ON fi."matrixId" = mp."matrixId"
                    WHERE "refStructureName" = '${refStructureName}'
                    AND "companyName" = '${companyName}'
                    AND "fieldName" = '${fieldName}'
                    AND "sectorName" = '${sectorName}'
                    AND "plantRow" = '${plantRow}'
                    AND "timestamp_from" < '${parseInt(timestamp)}' 
                    AND ("timestamp_to" > '${parseInt(timestamp)}' OR "timestamp_to" IS NULL)
                ) as weighted 
                    ON weighted."source" = di."source"
                        AND weighted."refStructureName" = di."refStructureName"
                        AND weighted."companyName" = di."companyName"
                        AND weighted."fieldName" = di."fieldName"
                        AND weighted."sectorName" = di."sectorName"
                        AND weighted."plantRow" = di."plantRow"
                        AND weighted."xx" = di."xx"
                        AND weighted."yy" = di."yy"
                WHERE di."timestamp" = ${timestamp}/3600::INT*3600
                    AND di."refStructureName" = '${refStructureName}'
                    AND di."companyName" = '${companyName}'
                    AND di."fieldName" = '${fieldName}'
                    AND di."sectorName" = '${sectorName}'
                    AND di."plantRow" = '${plantRow}'
                ) as q1
            JOIN (
                SELECT "source", "refStructureName", "companyName", "fieldName", "sectorName", "plantRow", "xx", "yy", (CASE WHEN "optValue" > -300 THEN LN(ABS("optValue")) * "weight"
                    ELSE LN(ABS(-300)) * "weight" END):: numeric as "value"
                FROM field_matrix as fm
                JOIN matrix_profile as mp ON fm."matrixId" = mp."matrixId"
                WHERE "refStructureName" = '${refStructureName}'
                    AND "companyName" = '${companyName}'
                    AND "fieldName" = '${fieldName}'
                    AND "sectorName" = '${sectorName}'
                    AND "plantRow" = '${plantRow}'
                    AND "timestamp_from" < '${parseInt(timestamp)}' 
                    AND ("timestamp_to" > '${parseInt(timestamp)}' OR "timestamp_to" IS NULL)
                ) as q2
            ON q1."source" = q2."source"
                        AND q1."refStructureName" = q2."refStructureName"
                        AND q1."companyName" = q2."companyName"
                        AND q1."fieldName" = q2."fieldName"
                        AND q1."sectorName" = q2."sectorName"
                        AND q1."plantRow" = q2."plantRow"
                        AND q1."xx" = q2."xx"
                        AND q1."yy" = q2."yy"`;

        const results = await this.sequelize.query(queryString, {
           type: QueryTypes.SELECT,
           bind: {
               timestamp,
               refStructureName,
               companyName,
               fieldName,
               sectorName,
               plantRow
           }
        });

        return results
    }


}

export default DeltaRepository;
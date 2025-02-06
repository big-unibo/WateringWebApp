import { DeltaWrapper } from '../querywrappers/DeltaWrapper.js';
import { QueryTypes } from "sequelize";

class DeltaRepository {

    constructor(sequelize) {
        this.sequelize = sequelize;
    }

    async findDelta(timestampFrom, timestampTo, refStructureName, companyName, fieldName, sectorName, plantRow) {

        const queryString = ` 
            WITH field_data AS (
                SELECT fi."source", fi."refStructureName", fi."companyName", fi."fieldName", fi."sectorName", fi."plantRow", 
                    mp."xx", mp."yy", mp."weight", mp."optValue", fi."timestamp_from", fi."timestamp_to"
                FROM field_matrix AS fi
                JOIN matrix_profile AS mp ON fi."matrixId" = mp."matrixId"
                WHERE fi."refStructureName" = '${refStructureName}'
                    AND fi."companyName" = '${companyName}'
                    AND fi."fieldName" = '${fieldName}'
                    AND fi."sectorName" = '${sectorName}'
                    AND fi."plantRow" = '${plantRow}'
                    AND fi."timestamp_from" < '${timestampTo}'
                    AND (fi."timestamp_to" > '${timestampFrom}' OR fi."timestamp_to" IS NULL)
                ),
            watering_data AS (
                SELECT ("advice_timestamp" / 3600)::INT * 3600 AS "timestamp", "watering_start"
                FROM watering_schedule
                WHERE latest = true
                AND "watering_start" BETWEEN '${timestampFrom}' AND '${timestampTo}'
                AND "source" = 'iFarming'
                AND "refStructureName" = '${refStructureName}'
                AND "companyName" = '${companyName}'
                AND "fieldName" = '${fieldName}'
                AND "sectorName" = '${sectorName}'
                AND "plantRow" = '${plantRow}'
            )
            SELECT iq."source", iq."refStructureName", iq."companyName", iq."fieldName", iq."sectorName", iq."plantRow",
                AVG(CASE WHEN iq."value" > -300 THEN LN(ABS(iq."value")) * iq."weight"
                            ELSE LN(ABS(-300)) * iq."weight" END) AS "value",
                EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(iq."timestamp")))::INT AS "timestamp",
                'Media Pot. Idr. Giornaliera' AS "detectedValueTypeDescription"
            FROM (
                SELECT di."source", di."refStructureName", di."companyName", di."fieldName", di."sectorName", di."plantRow", 
                    di."timestamp", di."value", fd."weight" 
                FROM (
                    SELECT di."source", di."refStructureName", di."companyName", di."fieldName", di."sectorName", di."plantRow", 
                    wd."watering_start" AS "timestamp", di."value", di."xx", di."yy"
                    FROM data_interpolated AS di
                        JOIN watering_data AS wd ON wd."timestamp" = di."timestamp"
                ) as di
                JOIN field_data AS fd
                    ON fd."source" = di."source"
                        AND fd."refStructureName" = di."refStructureName"
                        AND fd."companyName" = di."companyName"
                        AND fd."fieldName" = di."fieldName"
                        AND fd."sectorName" = di."sectorName"
                        AND fd."plantRow" = di."plantRow"
                        AND fd."xx" = di."xx"
                        AND fd."yy" = di."yy"
                        AND di."timestamp" > fd."timestamp_from"
                        AND (di."timestamp" < fd."timestamp_to" OR fd."timestamp_to" IS NULL)
            ) AS iq
            GROUP BY iq."source", iq."refStructureName", iq."companyName", iq."fieldName", iq."sectorName", iq."plantRow", iq."timestamp"
            
            UNION
                (SELECT fd."source", fd."refStructureName", fd."companyName", fd."fieldName", fd."sectorName", fd."plantRow",
                ROUND(AVG(CASE WHEN fd."optValue" > -300 THEN LN(ABS(fd."optValue")) * fd."weight"
                            ELSE LN(ABS(-300)) * fd."weight" END)::numeric, 6) AS "value",
                EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd."watering_start")))::INT AS "timestamp",
                'Media Pot. Idr. Ottimale' AS "detectedValueTypeDescription"       
                FROM field_data AS fd
                JOIN watering_data AS wd ON wd."timestamp" > fd."timestamp_from" AND (wd."timestamp" < fd."timestamp_to" OR fd."timestamp_to" IS NULL)
                WHERE (fd.xx, fd.yy) IN (
                    SELECT DISTINCT xx, yy FROM data_interpolated 
                    WHERE "source" = 'iFarming' 
                    AND "refStructureName" = '${refStructureName}'
                    AND "companyName" = '${companyName}'
                    AND "fieldName" = '${fieldName}'
                    AND "sectorName" = '${sectorName}'
                    AND "plantRow" = '${plantRow}'
                    AND timestamp BETWEEN '${timestampFrom}' AND '${timestampTo}'
                )
                GROUP BY fd."source", fd."refStructureName", fd."companyName", fd."fieldName", fd."sectorName", fd."plantRow", wd."watering_start")
            ORDER BY "timestamp" DESC;
        `

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
                    WHERE "source" = 'iFarming' 
                    AND "refStructureName" = '${refStructureName}'
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
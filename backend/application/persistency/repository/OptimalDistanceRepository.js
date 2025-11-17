import { HUMIDITY_DEVICE_TYPE } from '../../commons/constants.js';
import { errorFunctionsSQLWrapper } from '../../commons/errorFunctions.js';
import { OptimalDistanceWrapper } from '../querywrappers/OptimalDistanceWrapper.js';
import { Op, QueryTypes } from "sequelize";

class OptimalDistanceRepository {

    constructor(models, sequelize) {
        this.WateringAlgorithmParams = models.WateringAlgorithmParams
        this.sequelize = sequelize;
    }

    async findDelta(thesisId, timeFilterFrom, timeFilterTo) {

        const errorFunction = await this.WateringAlgorithmParams.findOne({
            attributes: ["errorFunction", "validFrom", "validTo"],
            where: {
                thesisId: thesisId,
                // validFrom: {
                //     [Op.lt]: timeFilterTo
                // },
                // validTo: {
                //     [Op.or]: {
                //         [Op.gt]: timeFilterFrom,
                //         [Op.is]: null
                //     }
                // }
            },
            raw: true
        })

        let queryString = ` 
            WITH validity_table AS (
                SELECT 
                    thesis_id, 
                    thesis_name, 
                    sector_id,  
                    device_id
                FROM theses_all_signals
                WHERE device_type = :HUMIDITY_DEVICE_TYPE
                    AND thesis_id = :thesisId
                GROUP BY thesis_id, thesis_name, sector_id,  device_id
                    HAVING MIN(valid_from) < :timeFilterTo
                    AND MAX(COALESCE(valid_to, 'infinity')) > :timeFilterFrom
            ),
            field_data AS (
				SELECT 
                    op.value,
                    op.weight,
                    op.x,
                    op.y,
                    op.z,
                    gop.valid_from,
                    gop.valid_to,
                    gop.optimal_dry_bound,
                    gop.optimal_wet_bound
				FROM grid_optimal_profile_assignment gop
				JOIN validity_table v 
                    ON v.device_id = gop.grid_id
				JOIN optimal_profiles op
                    ON op.profile_id = gop.optimal_profile_id
                WHERE gop.valid_from < :timeFilterTo
                AND (gop.valid_to IS NULL OR gop.valid_to > :timeFilterFrom)
            ),
            watering_data AS (
                SELECT 
                    watering_start, 
                    v.thesis_name,
                    v.device_id
                FROM watering_events we
                JOIN validity_table v ON v.sector_id = we.sector_id
                WHERE we.latest = true
                    AND we.deleted = false
                    AND we.watering_start BETWEEN :timeFilterFrom AND :timeFilterTo
            )

            SELECT 
                wd.thesis_name as "thesisName",
                wd.device_id as "deviceId", 
                ROUND(AVG(${errorFunctionsSQLWrapper[errorFunction.errorFunction]("ip.value")} * fd.weight)::numeric,6) as value, 
                EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                'Media giornaliera' as "detectedValueTypeDescription"
            FROM watering_data wd 
            JOIN advices a 
                ON wd.watering_start = a.watering_start
            JOIN field_data fd 
                ON wd.watering_start 
                BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
            JOIN interpolated_profiles ip 
                ON ip.timestamp = a.image_timestamp
                AND ip.grid_id = wd.device_id
                AND ip.x = fd.x
                AND ip.y = fd.y
                AND ip.z = fd.z
            GROUP BY wd.thesis_name, wd.device_id, wd.watering_start
            UNION (
                SELECT DISTINCT
                    wd.thesis_name as "thesisName", 
                    wd.device_id as "deviceId",
                    ROUND(AVG(${errorFunctionsSQLWrapper[errorFunction.errorFunction]("fd.value")} * fd.weight)::numeric,6) as value,
                    EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                    'Media ottimale' as "detectedValueTypeDescription"
                FROM watering_data wd 
                JOIN field_data fd 
                    ON wd.watering_start 
                    BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
                 GROUP BY wd.thesis_name, wd.device_id, wd.watering_start
            )
            UNION(
                SELECT DISTINCT
                    wd.thesis_name as "thesisName", 
                    wd.device_id as "deviceId",
                    ${errorFunctionsSQLWrapper[errorFunction.errorFunction]("fd.optimal_dry_bound")} as value,
                    EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                    'Asciutto' as "detectedValueTypeDescription" 
                FROM watering_data wd 
                JOIN field_data fd 
                    ON wd.watering_start BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
            )
            UNION (
                SELECT DISTINCT
                    wd.thesis_name as "thesisName", 
                    wd.device_id as "deviceId",
                    ${errorFunctionsSQLWrapper[errorFunction.errorFunction]("fd.optimal_wet_bound")} as value,  
                    EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                    'Capacità di campo' as "detectedValueTypeDescription" 
                FROM watering_data wd 
                JOIN field_data fd 
                    ON wd.watering_start BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
            )
            ORDER BY timestamp, "detectedValueTypeDescription" DESC
        `

        const results = await this.sequelize.query(queryString, {
            type: QueryTypes.SELECT,
            replacements: {
                HUMIDITY_DEVICE_TYPE,
                thesisId,
                timeFilterFrom,
                timeFilterTo
            }
        });
        return results
    }

    async findPunctualDistance(thesisId, timestamp) {

        const errorFunction = await this.WateringAlgorithmParams.findOne({
            attributes: ["errorFunction"],
            where: {
                thesisId: thesisId,
                validFrom: {
                    [Op.lt]: timestamp
                },
                validTo: {
                    [Op.or]: {
                        [Op.gt]: timestamp,
                        [Op.is]: null
                    }
                }
            },
            raw: true
        })

        const queryString = `
            SELECT grid."thesisName", ip.timestamp, ip.x, ip.y, ip.z, optimal."weight", 
                (${errorFunctionsSQLWrapper[errorFunction.errorFunction]("ip.value")} - 
                ${errorFunctionsSQLWrapper[errorFunction.errorFunction]("optimal.value")}) * optimal."weight" AS distance
                FROM interpolated_profiles as ip
                JOIN (SELECT DISTINCT device_id, thesis_name AS "thesisName" FROM theses_all_signals
                        WHERE device_type = :HUMIDITY_DEVICE_TYPE 
                            AND thesis_id = :thesisId
                            AND valid_from < :timestamp AND (valid_to > :timestamp OR valid_to IS NULL)
                ) as grid
                    ON ip.grid_id = grid.device_id
                JOIN LATERAL(
                    SELECT "grid_id", "x", "y", "z", "value", "weight"
                    FROM grid_optimal_profile_assignment as ga
                    JOIN optimal_profiles as op ON ga."optimal_profile_id" = op."profile_id"
                    WHERE grid_id = grid.device_id
                    AND "valid_from" < :timestamp
                    AND ("valid_to" > :timestamp OR "valid_to" IS NULL)
                ) as  optimal
                    ON optimal."grid_id" = ip."grid_id"
                        AND optimal."x" = ip."x"
                        AND optimal."y" = ip."y"
                        AND optimal."z" = ip."z"
                WHERE ip."timestamp" = :timestamp /3600::INT*3600`;

        const results = await this.sequelize.query(queryString, {
            type: QueryTypes.SELECT,
            replacements: {
                HUMIDITY_DEVICE_TYPE,
                thesisId,
                timestamp
            }
        });
        return results
    }


}

export default OptimalDistanceRepository;


// async findDelta(timestampFrom, timestampTo, refStructureName, companyName, fieldName, sectorName, thesisName) {

//         const queryString = `
//             WITH field_data AS (
//                 SELECT fi."source", fi."refStructureName", fi."companyName", fi."fieldName", fi."sectorName", fi."thesisName",
//                     mp."xx", mp."yy", mp."weight", mp."optValue", fi."timestamp_from", fi."timestamp_to"
//                 FROM field_matrix AS fi
//                 JOIN matrix_profile AS mp ON fi."matrixId" = mp."matrixId"
//                 WHERE fi."refStructureName" = '${refStructureName}'
//                     AND fi."companyName" = '${companyName}'
//                     AND fi."fieldName" = '${fieldName}'
//                     AND fi."sectorName" = '${sectorName}'
//                     AND fi."thesisName" = '${thesisName}'
//                     AND fi."timestamp_from" < '${timestampTo}'
//                     AND (fi."timestamp_to" > '${timestampFrom}' OR fi."timestamp_to" IS NULL)
//                 ),
//             watering_data AS (
//                 SELECT ("advice_timestamp" / 3600)::INT * 3600 AS "timestamp", "watering_start"
//                 FROM watering_schedule
//                 WHERE latest = true
//                 AND "watering_start" BETWEEN '${timestampFrom}' AND '${timestampTo}'
//                 AND "source" = 'iFarming'
//                 AND "refStructureName" = '${refStructureName}'
//                 AND "companyName" = '${companyName}'
//                 AND "fieldName" = '${fieldName}'
//                 AND "sectorName" = '${sectorName}'
//                 AND "thesisName" = '${thesisName}'
//             )
//             SELECT iq."source", iq."refStructureName", iq."companyName", iq."fieldName", iq."sectorName", iq."thesisName",
//                 ROUND((SUM(CASE WHEN iq."value" > -300 THEN LN(ABS(iq."value")) * iq."weight"
//                             ELSE LN(ABS(-300)) * iq."weight" END) / SUM(iq."weight"))::numeric,6) AS "value",
//                 EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(iq."timestamp")))::INT AS "timestamp",
//                 'Media Pot. Idr. Giornaliera' AS "detectedValueTypeDescription"
//             FROM (
//                 SELECT di."source", di."refStructureName", di."companyName", di."fieldName", di."sectorName", di."thesisName",
//                     di."timestamp", di."value", fd."weight"
//                 FROM (
//                     SELECT di."source", di."refStructureName", di."companyName", di."fieldName", di."sectorName", di."thesisName",
//                     wd."watering_start" AS "timestamp", di."value", di."xx", di."yy"
//                     FROM data_interpolated AS di
//                         JOIN watering_data AS wd ON wd."timestamp" = di."timestamp"
//                 ) as di
//                 JOIN field_data AS fd
//                     ON fd."source" = di."source"
//                         AND fd."refStructureName" = di."refStructureName"
//                         AND fd."companyName" = di."companyName"
//                         AND fd."fieldName" = di."fieldName"
//                         AND fd."sectorName" = di."sectorName"
//                         AND fd."thesisName" = di."thesisName"
//                         AND fd."xx" = di."xx"
//                         AND fd."yy" = di."yy"
//                         AND di."timestamp" > fd."timestamp_from"
//                         AND (di."timestamp" < fd."timestamp_to" OR fd."timestamp_to" IS NULL)
//             ) AS iq
//             GROUP BY iq."source", iq."refStructureName", iq."companyName", iq."fieldName", iq."sectorName", iq."thesisName", iq."timestamp"
//             UNION
//                 (SELECT fd."source", fd."refStructureName", fd."companyName", fd."fieldName", fd."sectorName", fd."thesisName",
//                 ROUND((SUM(CASE WHEN fd."optValue" > -300 THEN LN(ABS(fd."optValue")) * fd."weight"
//                             ELSE LN(ABS(-300)) * fd."weight" END)/SUM(fd."weight"))::numeric,6) AS "value",
//                 EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd."watering_start")))::INT AS "timestamp",
//                 'Media Pot. Idr. Ottimale' AS "detectedValueTypeDescription"
//                 FROM field_data AS fd
//                 JOIN watering_data AS wd ON wd."timestamp" > fd."timestamp_from" AND (wd."timestamp" < fd."timestamp_to" OR fd."timestamp_to" IS NULL)
//                 WHERE (fd.xx, fd.yy) IN (
//                     SELECT DISTINCT xx, yy FROM data_interpolated
//                     WHERE "source" = 'iFarming'
//                     AND "refStructureName" = '${refStructureName}'
//                     AND "companyName" = '${companyName}'
//                     AND "fieldName" = '${fieldName}'
//                     AND "sectorName" = '${sectorName}'
//                     AND "thesisName" = '${thesisName}'
//                     AND timestamp BETWEEN '${timestampFrom}' AND '${timestampTo}'
//                 )
//                 GROUP BY fd."source", fd."refStructureName", fd."companyName", fd."fieldName", fd."sectorName", fd."thesisName", wd."watering_start")
//             UNION
//                 (SELECT 'iFarming', '${refStructureName}', '${companyName}', '${fieldName}', '${sectorName}', '${thesisName}',
//                 ROUND(LN(ABS(-300))::numeric,6) AS "value",
//                 EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd."watering_start")))::INT AS "timestamp",
//                 'Pot. Idr. Asciutto (-300 cbar)' AS "detectedValueTypeDescription"
//                 FROM watering_data AS wd)
//             UNION
//                 (SELECT 'iFarming', '${refStructureName}', '${companyName}', '${fieldName}', '${sectorName}', '${thesisName}',
//                 ROUND(LN(ABS(-20))::numeric,6) AS "value",
//                 EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd."watering_start")))::INT AS "timestamp",
//                 'Pot. Idr. Capacità di campo (-20 cbar)' AS "detectedValueTypeDescription"
//                 FROM watering_data AS wd)
//             ORDER BY "timestamp" DESC;
//         `

//         const results = await this.sequelize.query(queryString, {
//            type: QueryTypes.SELECT,
//            bind: {
//                timestampFrom,
//                timestampTo,
//                refStructureName,
//                companyName,
//                fieldName,
//                sectorName,
//                thesisName
//            }
//         });

//         return results.map(result => new OptimalDistanceWrapper(
//             result.refStructureName,
//             result.companyName,
//             result.fieldName,
//             result.sectorName,
//             result.thesisName,
//             result.value,
//             result.timestamp,
//             result.detectedValueTypeDescription
//         ));
//     }
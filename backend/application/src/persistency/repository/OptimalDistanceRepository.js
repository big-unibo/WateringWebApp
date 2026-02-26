import { HUMIDITY_DEVICE_TYPE } from '../../commons/constants.js';
import { errorFunctionsSQLWrapper, errorFunctionsUnits } from '../../commons/errorFunctions.js';
import { Op, QueryTypes } from "sequelize";

class OptimalDistanceRepository {

    constructor(models, sequelize) {
        this.WateringAlgorithmParams = models.WateringAlgorithmParams
        this.sequelize = sequelize;
    }

    async findOptimalDistance(thesisId, timeFilterFrom, timeFilterTo) {

        const errorFunction = await this.WateringAlgorithmParams.findOne({
            attributes: ["errorFunction", "validFrom", "validTo"],
            where: {
                thesisId: thesisId,
                validFrom: {
                    [Op.lt]: timeFilterTo
                },
                validTo: {
                    [Op.or]: {
                        [Op.gt]: timeFilterFrom,
                        [Op.is]: null
                    }
                }
            },
            order: [["validFrom", "DESC"]],
            raw: true
        })

        if(!errorFunction){
            throw new Error("Watering algorithm params not defined")
        }

        let queryString = ` 
            WITH validity_table AS (
                SELECT 
                    thesis_id, 
                    thesis_name, 
                    sector_id,  
                    device_id,
                    unit
                FROM theses_all_signals
                WHERE device_type = :HUMIDITY_DEVICE_TYPE
                    AND thesis_id = :thesisId
                GROUP BY thesis_id, thesis_name, unit, sector_id,  device_id
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
                    v.device_id,
                    v.unit
                FROM watering_events we
                JOIN validity_table v ON v.sector_id = we.sector_id
                WHERE we.watering_start BETWEEN :timeFilterFrom AND :timeFilterTo
            )

            SELECT 
                wd.thesis_name as "thesisName",
                wd.device_id as "deviceId",
                ${errorFunctionsUnits[errorFunction.errorFunction]("wd.unit")} as unit,  
                ROUND((SUM(${errorFunctionsSQLWrapper[errorFunction.errorFunction]("ic.value")} * fd.weight)/SUM(fd.weight))::numeric,6) as value, 
                EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                'Media giornaliera' as "valueType"
            FROM watering_data wd 
            JOIN advices a 
                ON wd.watering_start = a.watering_start
            JOIN field_data fd 
                ON wd.watering_start 
                BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
            JOIN interpolated_profiles ip 
                ON ip.timestamp = FLOOR(a.image_timestamp/3600)*3600
                AND ip.grid_id = wd.device_id
            JOIN interpolated_cells ic 
                ON ip.id = ic.profile_id
                AND ic.x = fd.x
                AND ic.y = fd.y
                AND ic.z = fd.z
            GROUP BY wd.thesis_name, wd.device_id, unit, wd.watering_start
            UNION (
                SELECT DISTINCT
                    wd.thesis_name as "thesisName", 
                    wd.device_id as "deviceId",
                    ${errorFunctionsUnits[errorFunction.errorFunction]("wd.unit")} as unit, 
                    ROUND((SUM(${errorFunctionsSQLWrapper[errorFunction.errorFunction]("fd.value")} * fd.weight)/SUM(fd.weight))::numeric,6) as value,
                    EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                    'Media ottimale' as "valueType"
                FROM watering_data wd 
                JOIN field_data fd 
                    ON wd.watering_start 
                    BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
                GROUP BY wd.thesis_name, wd.device_id, unit, wd.watering_start
            )
            UNION(
                SELECT DISTINCT
                    wd.thesis_name as "thesisName", 
                    wd.device_id as "deviceId",
                    ${errorFunctionsUnits[errorFunction.errorFunction]("wd.unit")} as unit, 
                    ${errorFunctionsSQLWrapper[errorFunction.errorFunction]("fd.optimal_dry_bound")} as value,
                    EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                    'Asciutto' as "valueType" 
                FROM watering_data wd 
                JOIN field_data fd 
                    ON wd.watering_start BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
            )
            UNION (
                SELECT DISTINCT
                    wd.thesis_name as "thesisName", 
                    wd.device_id as "deviceId",
                    ${errorFunctionsUnits[errorFunction.errorFunction]("wd.unit")} as unit, 
                    ${errorFunctionsSQLWrapper[errorFunction.errorFunction]("fd.optimal_wet_bound")} as value,  
                    EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                    'Capacità di campo' as "valueType" 
                FROM watering_data wd 
                JOIN field_data fd 
                    ON wd.watering_start BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
            )
            ORDER BY timestamp, "valueType" DESC
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

        if(!errorFunction){
            throw new Error("Watering algorithm params not defined")
        }


        const queryString = `
            SELECT grid."thesisName", ip.timestamp, ic.x, ic.y, ic.z, optimal."weight", 
                (${errorFunctionsSQLWrapper[errorFunction.errorFunction]("ic.value")} - 
                ${errorFunctionsSQLWrapper[errorFunction.errorFunction]("optimal.value")}) * optimal."weight" AS distance
                FROM interpolated_profiles as ip
                JOIN interpolated_cells ic
                    ON ip.id = ic.profile_id
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
                        AND optimal."x" = ic."x"
                        AND optimal."y" = ic."y"
                        AND optimal."z" = ic."z"
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
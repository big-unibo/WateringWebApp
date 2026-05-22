import { HUMIDITY_DEVICE_TYPE } from '../../commons/constants.js';
import { errorFunctionsSQLWrapper, errorFunctionsUnits } from '../../commons/errorFunctions.js';
import { Op, QueryTypes, where } from "sequelize";

class OptimalDistanceRepository {

    constructor(models, sequelize) {
        this.WateringAlgorithmParams = models.WateringAlgorithmParams
        this.Thesis = models.Thesis
        this.ThesisInSector = models.ThesisInSector
        this.sequelize = sequelize;
    }

    async findThesisOptimalDistance(thesisId, timeFilterFrom, timeFilterTo, alghoritmViewFlag = false ) {

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

        const timestampQuery = !alghoritmViewFlag ? `
                SELECT 
                    EXTRACT(EPOCH FROM gs.hour_timestamp)::bigint AS watering_start,
                    v.thesis_name,
                    v.device_id,
                    v.unit
                FROM generate_series(
                        to_timestamp(:timeFilterFrom),
                        to_timestamp(:timeFilterTo),
                        interval '1 day'
                    ) AS gs(hour_timestamp)
                JOIN validity_table v
                    ON TRUE
                ` : `
                SELECT 
                    watering_start, 
                    v.thesis_name,
                    v.device_id,
                    v.unit
                FROM watering_events we
                JOIN validity_table v ON v.sector_id = we.sector_id
                WHERE we.watering_start BETWEEN :timeFilterFrom AND :timeFilterTo
                `;

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
                    gop.optimal_wet_bound,
                    gop.stop_threshold
				FROM grid_optimal_profile_assignment gop
				JOIN validity_table v 
                    ON v.device_id = gop.grid_id
				JOIN optimal_profiles op
                    ON op.profile_id = gop.optimal_profile_id
                WHERE gop.valid_from < :timeFilterTo
                    AND (gop.valid_to IS NULL OR gop.valid_to > :timeFilterFrom)
            ),
            watering_data AS (
                ${timestampQuery}
            )

            SELECT 
                wd.thesis_name as "thesisName",
                wd.device_id as "deviceId",
                ${errorFunctionsUnits[errorFunction.errorFunction]("wd.unit")} as unit,  
                ROUND((SUM(${errorFunctionsSQLWrapper[errorFunction.errorFunction]("ic.value")} * fd.weight)/SUM(fd.weight))::numeric,6) as value, 
                EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                'Media giornaliera' as "valueType"
            FROM watering_data wd 
            ${alghoritmViewFlag ? "JOIN advices a ON wd.watering_start = a.watering_start": ""}
            JOIN field_data fd 
                ON wd.watering_start 
                BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
            ${ alghoritmViewFlag ? `JOIN interpolated_profiles ip 
                ON ip.timestamp = FLOOR(a.image_timestamp/3600)*3600
                AND ip.grid_id = wd.device_id`:
                `JOIN LATERAL (
                    SELECT id
                    FROM interpolated_profiles ip
                    WHERE ip.grid_id = wd.device_id
                    AND ip.timestamp BETWEEN wd.watering_start - 12 * 3600
                                        AND wd.watering_start
                    ORDER BY ip.timestamp DESC
                    LIMIT 1
                ) ip ON true`
            }
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
            UNION (
                SELECT DISTINCT
                    wd.thesis_name as "thesisName", 
                    wd.device_id as "deviceId",
                    ${errorFunctionsUnits[errorFunction.errorFunction]("wd.unit")} as unit, 
                    ROUND((SUM(${errorFunctionsSQLWrapper[errorFunction.errorFunction]("fd.value")} * fd.weight)/SUM(fd.weight) + ABS(SUM(${errorFunctionsSQLWrapper[errorFunction.errorFunction]("fd.value")} * fd.weight)/SUM(fd.weight))* fd.stop_threshold/100)::numeric,6) as value,
                    EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                    'Stop irrigazione' as "valueType" 
                FROM watering_data wd 
                JOIN field_data fd 
                    ON wd.watering_start 
                    BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
                GROUP BY wd.thesis_name, wd.device_id, unit, wd.watering_start, fd.stop_threshold
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

    async findSectorOptimalDistance(sectorId, timeFilterFrom, timeFilterTo, alghoritmViewFlag = false) {
        
        const errorFunction = await this.WateringAlgorithmParams.findOne({
            attributes: ["errorFunction", "validFrom", "validTo"],
            where: {
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
            include: [{
                model: this.Thesis,
                as: 'thesis',
                include: [{
                    model: this.ThesisInSector,
                    as: 'thesisInSector',
                    where: {
                        sectorId: sectorId
                    },
                    required: true
                }],
                required: true
            }],
            order: [["validFrom", "DESC"]],
            raw: true
        })

        if(!errorFunction){
            throw new Error("Watering algorithm params not defined")
        }

        const timestampQuery = !alghoritmViewFlag ? `
                SELECT 
                    gs.watering_start,
                    v.thesis_id,
                    v.device_id,
                    v.unit,
                    v.weight as thesis_weight
                FROM generate_series(
                        :timeFilterFrom,
                        :timeFilterTo,
                        86400
                    ) AS gs(watering_start)
                JOIN validity_table v
                    ON gs.watering_start > v.valid_from
                    AND gs.watering_start < COALESCE(v.valid_to, 'Infinity')
                ` : `
                SELECT 
                    watering_start, 
                    v.thesis_id,
                    v.sector_id,
                    v.device_id,
                    v.unit,
                    v.weight as thesis_weight
                FROM watering_events we
                JOIN validity_table v ON v.sector_id = we.sector_id
                WHERE we.watering_start BETWEEN :timeFilterFrom AND :timeFilterTo
                `;

        let queryString = `
            WITH validity_table AS (
                SELECT
                    ts.thesis_id,
                    ta.thesis_name,
                    ts.sector_id,
                    ta.device_id,
                    ts.weight,
					ts.valid_from,
					ts.valid_to,
                    ta.unit
                FROM theses_all_signals ta
					JOIN theses_in_sectors ts
					ON ta.sector_id = ts.sector_id
						AND ta.thesis_id = ts.thesis_id
						AND ts.valid_from >= ta.valid_from 
						AND COALESCE(ts.valid_to, 'Infinity')<=COALESCE(ta.valid_to, 'Infinity')
                WHERE device_type = :HUMIDITY_DEVICE_TYPE
                    AND ts.sector_id = :sectorId
					AND ts.valid_from < :timeFilterTo
					AND COALESCE(ts.valid_to, 'infinity') > :timeFilterFrom
                GROUP BY ts.thesis_id, ta.thesis_name, ts.sector_id, ta.device_id, ts.weight, ts.valid_from,
					ts.valid_to, ta.unit
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
                    gop.optimal_wet_bound,
                    gop.stop_threshold
				FROM grid_optimal_profile_assignment gop
				JOIN validity_table v 
                    ON v.device_id = gop.grid_id
				JOIN optimal_profiles op
                    ON op.profile_id = gop.optimal_profile_id
                WHERE gop.valid_from < COALESCE(v.valid_to, 'Infinity')
                    AND COALESCE(gop.valid_to, 'Infinity') > v.valid_from
            ),
            watering_data AS (
                ${timestampQuery}
            )

            SELECT timestamp, "valueType", "unit", SUM(value * thesis_weight) AS value
			FROM (

                SELECT 
                    wd.thesis_id,
                    wd.device_id as "deviceId",
                    ${errorFunctionsUnits[errorFunction.errorFunction]("wd.unit")} as unit,  
                    ROUND((SUM(${errorFunctionsSQLWrapper[errorFunction.errorFunction]("ic.value")} * fd.weight)/SUM(fd.weight))::numeric,6) as value, 
                    EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                    'Media giornaliera' as "valueType",
                    wd.thesis_weight
                FROM watering_data wd 
                ${alghoritmViewFlag ? "JOIN advices a ON wd.watering_start = a.watering_start": ""}
                JOIN field_data fd 
                    ON wd.watering_start 
                    BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
                ${ alghoritmViewFlag ? `JOIN interpolated_profiles ip 
                    ON ip.timestamp = FLOOR(a.image_timestamp/3600)*3600
                    AND ip.grid_id = wd.device_id`:
                    `JOIN LATERAL (
                        SELECT id
                        FROM interpolated_profiles ip
                        WHERE ip.grid_id = wd.device_id
                        AND ip.timestamp BETWEEN wd.watering_start - 12 * 3600
                                            AND wd.watering_start
                        ORDER BY ip.timestamp DESC
                        LIMIT 1
                    ) ip ON true`
                }
                JOIN interpolated_cells ic 
                    ON ip.id = ic.profile_id
                    AND ic.x = fd.x
                    AND ic.y = fd.y
                    AND ic.z = fd.z
                GROUP BY wd.thesis_id, wd.device_id, unit, wd.watering_start, wd.thesis_weight
                UNION (
                    SELECT DISTINCT
                        wd.thesis_id, 
                        wd.device_id as "deviceId",
                        ${errorFunctionsUnits[errorFunction.errorFunction]("wd.unit")} as unit, 
                        ROUND((SUM(${errorFunctionsSQLWrapper[errorFunction.errorFunction]("fd.value")} * fd.weight)/SUM(fd.weight))::numeric,6) as value,
                        EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                        'Media ottimale' as "valueType",
                        wd.thesis_weight
                    FROM watering_data wd 
                    JOIN field_data fd 
                        ON wd.watering_start 
                        BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
                    GROUP BY wd.thesis_id, wd.device_id, unit, wd.watering_start, wd.thesis_weight
                ) UNION (
                    SELECT DISTINCT
                        wd.thesis_id,
                        wd.device_id as "deviceId",
                        ${errorFunctionsUnits[errorFunction.errorFunction]("wd.unit")} as unit, 
                        ${errorFunctionsSQLWrapper[errorFunction.errorFunction]("fd.optimal_dry_bound")} as value,
                        EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                        'Asciutto' as "valueType",
                        wd.thesis_weight
                    FROM watering_data wd 
                    JOIN field_data fd 
                        ON wd.watering_start BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
                )
                UNION (
                    SELECT DISTINCT
                        wd.thesis_id,
                        wd.device_id as "deviceId",
                        ${errorFunctionsUnits[errorFunction.errorFunction]("wd.unit")} as unit, 
                        ${errorFunctionsSQLWrapper[errorFunction.errorFunction]("fd.optimal_wet_bound")} as value,  
                        EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                        'Capacità di campo' as "valueType",
                        wd.thesis_weight
                    FROM watering_data wd 
                    JOIN field_data fd 
                        ON wd.watering_start BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
                )
                UNION (
                    SELECT wd.thesis_id,
                        wd.device_id as "deviceId",
                        ${errorFunctionsUnits[errorFunction.errorFunction]("wd.unit")} as unit, 
                        ROUND((SUM(${errorFunctionsSQLWrapper[errorFunction.errorFunction]("fd.value")} * fd.weight)/SUM(fd.weight) + ABS(SUM(${errorFunctionsSQLWrapper[errorFunction.errorFunction]("fd.value")} * fd.weight)/SUM(fd.weight))* fd.stop_threshold/100)::numeric,6) as value,
                        EXTRACT(EPOCH FROM DATE_TRUNC('day', TO_TIMESTAMP(wd.watering_start)))::INT  as timestamp, 
                        'Stop irrigazione' as "valueType",
                        wd.thesis_weight
                    FROM watering_data wd 
                    JOIN field_data fd 
                        ON wd.watering_start BETWEEN fd.valid_from AND COALESCE(fd.valid_to, :timeFilterTo)
                    GROUP BY wd.thesis_id, wd.device_id, unit, wd.watering_start, wd.thesis_weight, fd.stop_threshold
                )
			)
			GROUP BY timestamp, "valueType", "unit"
			HAVING ABS(SUM(thesis_weight) - 1) <= 1e-6
			ORDER BY timestamp, "valueType", "unit" DESC
        `

        const results = await this.sequelize.query(queryString, {
            type: QueryTypes.SELECT,
            replacements: {
                HUMIDITY_DEVICE_TYPE,
                sectorId,
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
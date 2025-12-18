
import { Op, QueryTypes } from 'sequelize';
import { HUMIDITY_DEVICE_TYPE } from '../../commons/constants.js';

class ThesesAllSignalsRepository {
    constructor(models, sequelize) {
        this.sequelize = sequelize;
        this.ThesesAllSignals = models.ThesesAllSignals;
        this.Measurement = models.Measurement;
        this.Signal = models.Signal;
    }

    async getMeasurementsByThesis(
        thesisId,
        signalTypes,
        timeFilterFrom,
        timeFilterTo,
        aggregationType,
        aggregationPeriod
    ) {
        const col = "value";

        const aggregationFunctions = {
            SUM:  `SUM(${col})`,
            AVG:  `AVG(${col})`,
            MIN:  `MIN(${col})`,
            MAX:  `MAX(${col})`,
            MED:  `percentile_cont(0.5) WITHIN GROUP (ORDER BY ${col})`,
        };

        const sqlAggregation = aggregationFunctions[aggregationType?.toUpperCase()] || aggregationFunctions.AVG
        const results = await this.getResults(thesisId, signalTypes, timeFilterFrom, timeFilterTo, sqlAggregation, aggregationPeriod);

        return Array.isArray(results) ? results : [];
    }


    async getResults(thesisId, signalTypes, timeFilterFrom, timeFilterTo, sqlAggregation, aggregationPeriod) {
        const query = `
            SELECT
                thesis_name AS "thesisName",
                device_id AS "deviceId",
                tas.signal_id AS "signalId",
                signal_description AS "signalDescription",
                signal_type AS "signalType",
                signal_type_description AS "signalTypeDescription",
                x, y, z,
                virtual,
                unit,
                computed,
                ROUND(timestamp::NUMERIC / :aggregationPeriod) * :aggregationPeriod AS "timestamp",
                COALESCE(to_jsonb(${sqlAggregation}), to_jsonb(ARRAY_AGG(raw_value) FILTER (WHERE raw_value IS NOT NULL))) AS "value"
            FROM theses_all_signals tas
            LEFT JOIN measurements m
                ON m.signal_id = tas.signal_id
                AND m.timestamp BETWEEN GREATEST(tas.valid_from, :timeFilterFrom) AND LEAST(COALESCE(tas.valid_to, 'infinity'), :timeFilterTo)
            WHERE tas.signal_type = ANY(ARRAY[:signalTypes])
            AND tas.thesis_id = :thesisId
            GROUP BY
                thesis_name,
                device_id,
                tas.signal_id,
                signal_description,
                signal_type,
                signal_type_description,
                x,
                y,
                z,
                virtual,
                unit,
                computed,
                ROUND(timestamp::NUMERIC / :aggregationPeriod) * :aggregationPeriod
            ORDER BY timestamp ASC;
            `;

        const results = await this.sequelize.query(query, {
        replacements: {
            aggregationPeriod,
            signalTypes,
            timeFilterFrom,
            timeFilterTo,
            thesisId
        },
            type: QueryTypes.SELECT
        });
        
        return results;
    }



    async getGridDeviceByThesis(thesisId, timeFilterFrom, timeFilterTo) {
        const result = await this.ThesesAllSignals.findOne({
            attributes: ['deviceId'], 
            where: {
                thesisId,
                deviceType: HUMIDITY_DEVICE_TYPE,
                [Op.and]: [
                    { validFrom: { [Op.lte]: timeFilterTo } },
                    {
                        [Op.or]: [
                            { validTo: { [Op.gte]: timeFilterFrom } },
                            { validTo: null }
                        ]
                    }
                ]
            },
            raw: true 
        });
        return result ? result.deviceId : null;
    }


    async getAdvicesAndExpectedWaterByThesis(        
        thesisId,
        timeFilterFrom,
        timeFilterTo,
        aggregationPeriod
    ){

        const query = `
            WITH valid_advices_table AS (
                SELECT td.thesis_id,
                    td.thesis_name,
                    a.watering_start,
                    a.advice
                FROM theses_denormalized td
                LEFT JOIN advices a
                    ON a.thesis_id = td.thesis_id
                    AND a.watering_start BETWEEN 
                        GREATEST(td.valid_from, :timeFilterFrom)
                        AND LEAST(COALESCE(td.valid_to, 'infinity'), :timeFilterTo)
                WHERE td.thesis_id = :thesisId
            ),
            valid_expected_water_table AS (
                SELECT td.thesis_id,
                    td.thesis_name,
                    td.sector_id,
                    we.id,
                    we.watering_start,
                    we.expected_water
                FROM theses_denormalized td
                LEFT JOIN watering_events we
                    ON we.sector_id = td.sector_id
                    AND we.watering_start BETWEEN 
                        GREATEST(td.valid_from, :timeFilterFrom)
                        AND LEAST(COALESCE(td.valid_to, 'infinity'), :timeFilterTo)
                WHERE td.thesis_id = :thesisId
            )

            SELECT *
            FROM (
                SELECT
                    va.thesis_name AS "thesisName",
                    'Advice for the thesis' AS "signalDescription",
                    'ADV' AS "signalType",
                    'Advice' AS "signalTypeDescription",
                    'L' AS unit,
                    ROUND(va.watering_start::NUMERIC / :aggregationPeriod) * :aggregationPeriod AS timestamp,
                    COALESCE(SUM(va.advice), 0) AS value
                FROM valid_advices_table va
                GROUP BY
                    va.thesis_name,
                    ROUND(va.watering_start::NUMERIC / :aggregationPeriod) * :aggregationPeriod
                UNION
                SELECT
                    vew.thesis_name AS "thesisName",
                    'Expected water' AS "signalDescription",
                    'EXP' AS "signalType",
                    'Expected Water' AS "signalTypeDescription",
                    'L' AS unit,
                    ROUND(vew.watering_start::NUMERIC / :aggregationPeriod) * :aggregationPeriod AS timestamp,
                    COALESCE(SUM(vew.expected_water), 0) AS value
                FROM valid_expected_water_table vew
                GROUP BY
                    vew.thesis_name,
                    ROUND(vew.watering_start::NUMERIC / :aggregationPeriod) * :aggregationPeriod
            ) AS merged_results
            ORDER BY timestamp ASC;
        `;

        const results = await this.sequelize.query(query, {
        replacements: {
            thesisId,
            timeFilterFrom,
            timeFilterTo,
            aggregationPeriod
        },
            type: QueryTypes.SELECT
        });

        return results;
    }

    async getDevicesByThesis(thesisId, timestamp, deviceTypes) {
        const query = `
            SELECT DISTINCT 
                device_id AS "deviceId",
                device_type AS "deviceType",
                device_description AS "deviceDescription",
                provider_id AS "providerId",
                signal_id_on_provider AS "idOnProvider",
                signal_id AS "signalId",
                signal_description AS "signalDescription",
                signal_type AS "signalType",
                signal_type_description AS "signalTypeDescription",
                measurement_timestamp AS "lastMeasurementTimestamp",
                virtual,
                unit,
                x, y, z
            FROM theses_all_signals tas
            JOIN LATERAL(
                SELECT MAX(timestamp) AS measurement_timestamp
                FROM measurements m
                WHERE m.signal_id = tas.signal_id
            ) m ON true
            WHERE thesis_id = :thesisId
                AND :timestamp BETWEEN valid_from AND COALESCE(valid_to, 'infinity') 
                ${deviceTypes?.length > 0 ? "AND tas.device_type = ANY(ARRAY[:deviceTypes])" : "" }
        `;

        try {
            const results = await this.sequelize.query(query, {
                replacements: { thesisId, timestamp, deviceTypes },
                type: this.sequelize.QueryTypes.SELECT
            });
            return results;
        } catch (error) {
            console.error(`Fail retrieving devices data: ${error.message}`);
            throw error;
        }
    }

    async getSignalsByThesis(thesisId, timestamp, signalTypes) {
        const query = `
            SELECT DISTINCT
                tas.device_id AS "deviceId",
                signal_id_on_provider AS "idOnProvider",
                tas.signal_id AS "signalId",
                tas.signal_description AS "signalDescription",
                tas.signal_type AS "signalType",
                tas.signal_type_description AS "signalTypeDescription",
                measurement_timestamp AS "lastMeasurementTimestamp",
                tas.x AS "x",
                tas.y AS "y",
                tas.z AS "z",
                tas.virtual AS "virtual",
                tas.unit AS "unit"
            FROM theses_all_signals tas
            JOIN LATERAL(
                SELECT MAX(timestamp) AS measurement_timestamp
                FROM measurements m
                WHERE m.signal_id = tas.signal_id
            ) m ON true
            WHERE :timestamp BETWEEN tas.valid_from AND COALESCE(tas.valid_to, 'infinity')
                ${signalTypes?.length > 0 ? "AND tas.signal_type = ANY(ARRAY[:signalTypes])" : "" }
                AND tas.thesis_id = :thesisId
        `;

        const results = await this.sequelize.query(query, {
        replacements: {
            thesisId,
            signalTypes,
            timestamp
        },
            type: QueryTypes.SELECT
        });
        return results;
    }
}

export default ThesesAllSignalsRepository;

import { Op, QueryTypes } from 'sequelize';

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
        aggregationType = 'SUM',
        aggregationPeriod
    ) {


        // Determina la stringa SQL da passare a getResults in base al tipo di aggregazione
        let sqlAggregation;
        switch (aggregationType.toUpperCase()) {
            case 'SUM':
                sqlAggregation = 'SUM(vm.value)';
                break;
            case 'AVG':
                sqlAggregation = 'AVG(vm.value)';
                break;
            case 'MIN':
                sqlAggregation = 'MIN(vm.value)';
                break;
            case 'MAX':
                sqlAggregation = 'MAX(vm.value)';
                break;
            case 'MED':
                sqlAggregation = 'percentile_cont(0.5) WITHIN GROUP (ORDER BY vm.\"value\")';
                break;
            default:
                sqlAggregation = 'AVG(vm.value)';
                break;
        }

        const results = await this.getResults(thesisId, signalTypes, timeFilterFrom, timeFilterTo, sqlAggregation, aggregationPeriod);

        return Array.isArray(results) ? results : [];
    }


    async getResults(thesisId, signalTypes, timeFilterFrom, timeFilterTo, sqlAggregation, aggregationPeriod) {
        const query = `
            WITH valid_measurements_table AS (
                SELECT DISTINCT
                    tas.thesis_name,
                    tas.device_id,
                    tas.signal_id,
                    tas.signal_description,
                    tas.signal_type,
                    tas.signal_type_description,
                    tas.x,
                    tas.y,
                    tas.z,
                    tas.virtual,
                    tas.unit,
                    m.computed,
                    m.value,
                    m.raw_value,
                    m.timestamp
                FROM theses_all_signals tas
                LEFT JOIN measurements m
                    ON m.signal_id = tas.signal_id
                AND m.timestamp BETWEEN 
                    GREATEST(tas.valid_from, :timeFilterFrom)
                    AND LEAST(COALESCE(tas.valid_to, 'infinity'), :timeFilterTo)
                WHERE tas.signal_type = ANY(ARRAY[:signalTypes])
                AND tas.thesis_id = :thesisId
            ),
            aggregated AS (
                SELECT
                    vm.thesis_name,
                    vm.device_id,
                    vm.signal_id,
                    vm.signal_description,
                    vm.signal_type,
                    vm.signal_type_description,
                    vm.x,
                    vm.y,
                    vm.z,
                    vm.virtual,
                    vm.unit,
                    vm.computed,
                    ${sqlAggregation} AS value,
                    ARRAY_AGG(vm.raw_value) FILTER (WHERE vm.raw_value IS NOT NULL) AS raw_value,
                    ROUND(vm.timestamp::NUMERIC / :aggregationPeriod) * :aggregationPeriod AS timestamp
                FROM valid_measurements_table vm
                GROUP BY
                    vm.thesis_name,
                    vm.device_id,
                    vm.signal_id,
                    vm.signal_description,
                    vm.signal_type,
                    vm.signal_type_description,
                    vm.x,
                    vm.y,
                    vm.z,
                    vm.virtual,
                    vm.unit,
                    vm.computed,
                    ROUND(vm.timestamp::NUMERIC / :aggregationPeriod) * :aggregationPeriod
            )
            SELECT
                thesis_name AS "thesisName",
                device_id AS "deviceId",
                signal_id AS "signalId",
                signal_description AS "signalDescription",
                signal_type AS "signalType",
                signal_type_description AS "signalTypeDescription",
                x, y, z,
                virtual,
                unit,
                computed,
                timestamp,
                COALESCE(to_jsonb(value), to_jsonb(raw_value)) AS "value"
            FROM aggregated
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
                deviceType: 'GRID',
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
                SELECT DISTINCT
                    tas.thesis_id,
                    tas.thesis_name,
                    a.watering_start,
                    a.advice
                FROM theses_all_signals tas
                LEFT JOIN advices a
                    ON a.thesis_id = tas.thesis_id
                    AND a.watering_start BETWEEN 
                        GREATEST(tas.valid_from, :timeFilterFrom)
                        AND LEAST(COALESCE(tas.valid_to, 'infinity'), :timeFilterTo)
                WHERE tas.thesis_id = :thesisId
            ),
            valid_expected_water_table AS (
                SELECT DISTINCT
                    tas.thesis_id,
                    tas.thesis_name,
                    tas.sector_id,
                    we.id,
                    we.watering_start,
                    we.expected_water
                FROM theses_all_signals tas
                LEFT JOIN watering_events we
                    ON we.sector_id = tas.sector_id
                    AND we.watering_start BETWEEN 
                        GREATEST(tas.valid_from, :timeFilterFrom)
                        AND LEAST(COALESCE(tas.valid_to, 'infinity'), :timeFilterTo)
                WHERE tas.thesis_id = :thesisId
                AND we.latest = true
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

    async getDevicesByThesis(thesisId) {
        const query = `
            SELECT DISTINCT 
                device_id as "deviceId",
                device_type as "deviceType",
                device_description as "deviceDescription",
                signal_id as "signalId",
                signal_description as "signalDescription",
                signal_type as "signalType",
                signal_type_description as "signalTypeDescription",
                virtual,
                unit,
                x, y, z
            FROM theses_all_signals
            WHERE thesis_id = :thesisId
        `;

        try {
            const results = await this.sequelize.query(query, {
                replacements: { thesisId },
                type: this.sequelize.QueryTypes.SELECT
            });
            return results;
        } catch (error) {
            console.error(`Fail retrieving devices data: ${error.message}`);
            throw error;
        }
    }

    async getSignalsByThesis(thesisId, signalTypes, timestamp) {
        const query = `
            SELECT DISTINCT
                tas.device_id as "deviceId",
                tas.signal_id as "signalId",
                tas.signal_description as "signalDescription",
                tas.signal_type as "signalType",
                tas.signal_type_description as "signalTypeDescription",
                tas.x as "x",
                tas.y as "y",
                tas.z as "z",
                tas.virtual as "virtual",
                tas.unit as "unit"
            FROM theses_all_signals tas
            WHERE :timestamp BETWEEN 
                tas.valid_from AND COALESCE(tas.valid_to, 'infinity')
            ${signalTypes.length > 0 ? "AND tas.signal_type = ANY(ARRAY[:signalTypes])" : "" }
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
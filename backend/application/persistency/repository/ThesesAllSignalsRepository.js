
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
                sqlAggregation = 'SUM(vm.value)';
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
                JOIN measurements m
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
                    ARRAY_AGG(vm.raw_value) AS raw_value,
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
}

export default ThesesAllSignalsRepository;
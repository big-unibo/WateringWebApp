
import { QueryTypes } from 'sequelize';

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
                sqlAggregation = 'SUM(\"value\")';
                break;
            case 'AVG':
                sqlAggregation = 'AVG(\"value\")';
                break;
            case 'MIN':
                sqlAggregation = 'MIN(\"value\")';
                break;
            case 'MAX':
                sqlAggregation = 'MAX(\"value\")';
                break;
            case 'MED':
                sqlAggregation = 'percentile_cont(0.5) WITHIN GROUP (ORDER BY \"value\")';
                break;
            default:
                sqlAggregation = 'SUM(\"value\")';
                break;
        }

        const results = await this.getResults(thesisId, signalTypes, timeFilterFrom, timeFilterTo, sqlAggregation, aggregationPeriod);

        return Array.isArray(results) ? results : [];
    }


    async getResults(thesisId, signalTypes, timeFilterFrom, timeFilterTo, sqlAggregation, aggregationPeriod) {
        const query = `
        WITH aggregated AS (
            SELECT
                tas."thesis_name" AS "thesisName",
                tas."device_id" AS "deviceId",
                tas."signal_id" AS "signalId",
                tas."signal_description" AS "signalDescription",
                tas."signal_type" AS "signalType",
                tas."signal_type_description" AS "signalTypeDescription",
                tas."x" as x,
                tas."y" as y,
                tas."z" as z,
                tas."virtual" as virtual,
                tas."unit" as unit,
                m."computed" AS computed,
                ${sqlAggregation} AS value,
                ARRAY_AGG(m."raw_value") AS rawValue,
                ROUND(m."timestamp"::NUMERIC / :aggregationPeriod) * :aggregationPeriod AS timestamp
            FROM theses_all_signals tas
            JOIN measurements m
                ON m."signal_id" = tas."signal_id"
                AND m."timestamp" >= tas."valid_from"
                AND (tas."valid_to" IS NULL OR m."timestamp" <= tas."valid_to")
            WHERE tas."signal_type" = ANY(ARRAY[:signalTypes])
            AND m."timestamp" BETWEEN :timeFilterFrom AND :timeFilterTo
            AND tas."thesis_id" = :thesisId
            GROUP BY
                tas."thesis_name",
                tas."device_id",
                tas."signal_id",
                tas."signal_description",
                tas."signal_type",
                tas."signal_type_description", 
                tas."x", 
                tas."y", 
                tas."z",
                tas."virtual", 
                tas."unit", 
                m."computed",
                ROUND(m."timestamp"::NUMERIC / :aggregationPeriod) * :aggregationPeriod
        )
        SELECT
            "thesisName",
            "deviceId",
            "signalId",
            "signalDescription",
            "signalType",
            "signalTypeDescription",
            x,
            y,
            z,
            virtual,
            unit,
            computed,
            timestamp,
            COALESCE(to_jsonb(value), to_jsonb(rawValue)) AS value
        FROM aggregated
        ORDER BY "timestamp" ASC;
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
        

        console.log(results);
        return results;
    }

    // async getResultsAgrregate(calculationType, thesisId, signalTypes, timeFilterFrom, timeFilterTo, aggregationPeriod) {
    //     const query = `
    //         SELECT DISTINCT
    //             tas."thesis_name",
    //             tas."device_id",
    //             tas."signal_id",
    //             tas."signal_description",
    //             tas."signal_type",
    //             s."x",
    //             s."y",
    //             s."z",
    //             s."virtual",
    //             s."unit",
    //             tas."valid_from",
    //             tas."valid_to",
    //             COALESCE(
    //                 ${calculationType}::TEXT,
    //                 (
    //                     SELECT STRING_AGG(m2.raw_value, ',' ORDER BY m2.timestamp)
    //                     FROM (
    //                         SELECT DISTINCT raw_value, timestamp
    //                         FROM measurements m2
    //                         WHERE m2.signal_id = m.signal_id
    //                     ) m2
    //                 )
    //             ) AS value,
    //             round(m."timestamp"::numeric / ${aggregationPeriod}) * ${aggregationPeriod} AS timestamp,
    //             m."computed"
    //         FROM theses_all_signals tas
    //         JOIN measurements m
    //             ON m."signal_id" = tas."signal_id"
    //             AND m."timestamp" >= tas."valid_from"
    //             AND (tas."valid_to" IS NULL OR m."timestamp" <= tas."valid_to")
    //         JOIN signals s
    //             ON s.id = tas.signal_id
    //         WHERE tas."signal_type" = ANY(ARRAY[${signalTypes.join(',')}])
    //         AND m."timestamp" >= ${timeFilterFrom}
    //         AND m."timestamp" <= ${timeFilterTo}
    //         AND tas."thesis_id" = ${thesisId}
    //         GROUP BY 
    //             tas."thesis_name",
    //             tas."device_id",
    //             tas."signal_id",
    //             tas."signal_description",
    //             tas."signal_type",
    //             s."x",
    //             s."y",
    //             s."z",
    //             s."virtual",
    //             s."unit",
    //             tas."valid_from",
    //             tas."valid_to",
    //             round(m."timestamp"::numeric / ${aggregationPeriod}) * ${aggregationPeriod}
    //         ORDER BY timestamp ASC;
    //     `;

    //     const results = await this.sequelize.query(query, {
    //         type: QueryTypes.SELECT
    //     });

    //     return results;
    // }
}

export default ThesesAllSignalsRepository;
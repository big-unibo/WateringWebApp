
import { QueryTypes } from 'sequelize';

class ThesesAllSignalsRepository {
    constructor(models, sequelize) {
        this.sequelize = sequelize;
        this.ThesesAllSignals = models.ThesesAllSignals;
        this.Measurement = models.Measurement;
        this.Signal = models.Signal;
    }

    async findHumidityEventsByThesis(thesisId, signalTypes, timeFilterFrom, timeFilterTo, aggregationPeriod ) {
        const signalsData = [];
        signalsData.push(...(await this.getResults( thesisId, signalTypes, timeFilterFrom, timeFilterTo, aggregationPeriod)));
        return signalsData;
    }

    async getResults(thesisId, signalTypes, timeFilterFrom, timeFilterTo, aggregationPeriod) {
        const query = `
            SELECT DISTINCT
                tas."thesis_name" as "thesisName",
                tas."device_id" as "deviceid",
                tas."signal_id" as "signalId",
                tas."signal_description" as "signalDescription",
                tas."signal_type" as "signalType",
                tas."x",
                tas."y",
                tas."z",
                tas."virtual",
                tas."unit",
                tas."valid_from" as "validFrom",
                tas."valid_to" as "validTo",
                COALESCE(m.value::text, m.raw_value) AS value,
                m."timestamp",
                m."computed"
            FROM theses_all_signals tas
            JOIN measurements m
                ON m."signal_id" = tas."signal_id"
                AND m."timestamp" >= tas."valid_from"
                AND (tas."valid_to" IS NULL OR m."timestamp" <= tas."valid_to")
            WHERE tas."signal_type" = ANY ('{ ${signalTypes.map(value => `${value}`).join(', ')} }')
            AND m."timestamp" >= ${timeFilterFrom}
            AND m."timestamp" <= ${timeFilterTo}
            AND tas."thesis_id" = ${thesisId}
            ORDER BY m."timestamp" ASC;
        `;

        const results = await this.sequelize.query(query, {
            type: QueryTypes.SELECT
        });

        //console.log(results);

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
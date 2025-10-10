import { QueryTypes } from 'sequelize';

class thesesAllSignalsRepository {
    constructor(models, sequelize) {
        this.sequelize;
        this.thesesAllSignals = models.thesesAllSignals;
        this.Measurements = models.Measurements;
    }

    async findHumidtyEventsByTheses(thesisId, signalTypes, timeFilterFrom, timeFilterTo){
        const signalsData = [];
        signalasData.push(...(await this.getResults('SUM(\"value\")', thesisId,signalTypes,timeFilterFrom,timeFilterTo,aggregationPeriod)))
        return signalsData;
    }

    async getResults(calculationType, thesisId, signalTypes, timeFilterFrom, timeFilterTo, aggregationPeriod) {
        const query = `
            SELECT DISTINCT
                tas."thesis_id",
                tas."thesis_name",
                tas."sector_id",
                tas."sector_name",
                tas."device_id",
                tas."signal_id",
                tas."signal_description",
                tas."signal_type",
                tas."valid_from",
                tas."valid_to",
                ${calculationType}(m."value") as value,
                round(m."timestamp"::numeric / :aggregationPeriod) * :aggregationPeriod AS timestamp
            FROM theses_all_sectors tas
            JOIN measurements m
                ON m."signal_id" = tas."signal_id"
                AND m."timestamp" >= tas."valid_from"
                AND (tas."valid_to" IS NULL OR m."timestamp" <= tas."valid_to")
            WHERE tas."type_id" = ANY(:signalTypes)
            AND m."timestamp" >= :timeFilterFrom
            AND m."timestamp" <= :timeFilterTo
            AND tas."thesis_id" = :thesisId
            GROUP BY 
                tas."thesis_id",
                tas."thesis_name",
                tas."sector_id",
                tas."sector_name",
                tas."device_id",
                tas."signal_id",
                tas."signal_description",
                tas."signal_type",
                tas."valid_from",
                tas."valid_to",
                round(m."timestamp"::numeric / :aggregationPeriod) * :aggregationPeriod
            ORDER BY timestamp ASC;
        `;

        const results = await this.sequelize.query(query, {
            type: QueryTypes.SELECT,
            bind: {
                thesisId,
                signalTypes,
                timeFilterFrom,
                timeFilterTo,
                aggregationPeriod
            }
        });
        return results;
    }
}

export default thesesAllSignalsRepository;
import { ViewDataOriginalWrapper } from '../querywrappers/ViewDataOriginalWrapper.js';

import { QueryTypes } from 'sequelize';

const getResults = async (calculationType, detectedValueTypeDescription, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName, aggregationPeriod, sequelize) => {

    const query = `
            SELECT DISTINCT "source",
                            "refStructureName",
                            "companyName",
                            "fieldName",
                            "detectedValueTypeDescription",
                            "sectorName",
                            "thesisName",
                            "colture",
                            "coltureType",
                            ${calculationType} as value,
                            round("timestamp"::numeric/${aggregationPeriod})*${aggregationPeriod} AS timestamp
            FROM view_data_original
            WHERE "detectedValueTypeId" = ANY ('{ ${detectedValueTypeDescription.map(value => `${value}`).join(', ')} }')
              AND "timestamp" >= '${timeFilterFrom}'
              AND "timestamp" <= '${timeFilterTo}'
              AND "source" = 'iFarming'
              AND "refStructureName" = '${refStructureName}'
              AND "companyName" = '${companyName}'
              AND "fieldName" = '${fieldName}'
              AND "sectorName" = '${sectorName}'
              AND "thesisName" = '${thesisName}'
            GROUP BY "source", "refStructureName", "companyName", "fieldName", "detectedValueTypeDescription", "sectorName", "thesisName", "colture", "coltureType", round("timestamp"::numeric/${aggregationPeriod})*${aggregationPeriod}
            ORDER BY timestamp ASC`;

    const results = await sequelize.query(query,
        {
            type: QueryTypes.SELECT,
            bind: {
                detectedValueTypeDescription,
                timeFilterFrom,
                timeFilterTo,
                refStructureName,
                companyName,
                fieldName,
                sectorName,
                thesisName,
                calculationType
            }
        }
    );

    return results.map(result => new ViewDataOriginalWrapper(
        result.refStructureName,
        result.companyName,
        result.fieldName,
        result.sectorName,
        result.thesisName,
        result.colture,
        result.coltureType,
        result.detectedValueTypeDescription,
        result.value,
        result.timestamp,
    ));
}

const getDripperAdjustedData = async (timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName, aggregationPeriod, sequelize)=>{
    const query = `
        SELECT vdo."source",
                vdo."refStructureName",
                vdo."companyName",
                vdo."fieldName",
                vdo."detectedValueTypeDescription",
                vdo."sectorName",
                vdo."thesisName",
                vdo."colture",
                vdo."coltureType",
                SUM(vdo."value" * COALESCE(ws."dripper_scaling_factor",1)) as value,
                round("timestamp"::numeric/${aggregationPeriod})*${aggregationPeriod} AS timestamp
        FROM view_data_original AS vdo
        LEFT JOIN watering_sector AS ws
            ON vdo."source" = ws."source"
            AND vdo."refStructureName" = ws."refStructureName"
            AND vdo."companyName" = ws."companyName"
            AND vdo."fieldName" = ws."fieldName"
            AND vdo."sectorName" = ws."sectorName"
            AND vdo."timestamp" >= ws."timestamp_from"
            AND (ws."timestamp_to" IS NULL OR vdo."timestamp" <= ws."timestamp_to")
        WHERE vdo."detectedValueTypeId" = 'DRIPPER'
        AND vdo."timestamp" >= '${timeFilterFrom}'
        AND vdo."timestamp" <= '${timeFilterTo}'
        AND vdo."source" = 'iFarming'
        AND vdo."refStructureName" = '${refStructureName}'
        AND vdo."companyName" = '${companyName}'
        AND vdo."fieldName" = '${fieldName}'
        AND vdo."sectorName" = '${sectorName}'
        AND vdo."thesisName" = '${thesisName}'
        GROUP BY vdo."source", vdo."refStructureName", vdo."companyName", vdo."fieldName", vdo."detectedValueTypeDescription", vdo."sectorName", vdo."thesisName", vdo."colture", vdo."coltureType", round("timestamp"::numeric/${aggregationPeriod})*${aggregationPeriod}
        ORDER BY timestamp ASC`;

    const results = await sequelize.query(query,
    {
        type: QueryTypes.SELECT,
        bind: {
            timeFilterFrom,
            timeFilterTo,
            refStructureName,
            companyName,
            fieldName,
            sectorName,
            thesisName,
            aggregationPeriod
        }
    }
    );

    return results.map(result => new ViewDataOriginalWrapper(
    result.refStructureName,
    result.companyName,
    result.fieldName,
    result.sectorName,
    result.thesisName,
    result.colture,
    result.coltureType,
    result.detectedValueTypeDescription,
    result.value,
    result.timestamp,
    ));
}

class ViewDataOriginalRepository {

    constructor(sequelize) {
        this.sequelize = sequelize;
    }

    async findAverageByFieldReference(detectedValueTypeDescription, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName, aggregationPeriod) {
        return getResults('AVG(\"value\")', detectedValueTypeDescription, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName, aggregationPeriod, this.sequelize);
    }

    async findEcAverageByFieldReference(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName, aggregationPeriod) {
        return getResults('AVG(64.3 * \"value\" -15.2)', ['ELECT_COND'], timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName, aggregationPeriod, this.sequelize);
    }

    async findHumidityEventsByFieldReference(detectedValueTypeDescription, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName, aggregationPeriod) {
        const dripperData = []
        if (detectedValueTypeDescription.includes('DRIPPER')) {
            dripperData.push(...(await getDripperAdjustedData(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName, aggregationPeriod, this.sequelize)))
        }
        dripperData.push(...(await getResults('SUM(\"value\")', detectedValueTypeDescription.filter(e => e !== 'DRIPPER'), timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName, aggregationPeriod, this.sequelize)))
        return dripperData
    }
}

export default ViewDataOriginalRepository;


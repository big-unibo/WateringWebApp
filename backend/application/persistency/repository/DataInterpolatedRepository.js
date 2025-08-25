import { ThesisPoints, ThesisPoint } from '../querywrappers/ThesisPointsWrapper.js';

import { DataInterpolatedWrapper } from '../querywrappers/DataInterpolatedWrapper.js';
import { DataInterpolatedMeanWrapper } from '../querywrappers/DataInterpolatedMeanWrapper.js';

import { QueryTypes } from 'sequelize';

const getResults = async (refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, timestampTo, sequelize) => {

    const query = `
        SELECT DISTINCT "source",
                        "refStructureName",
                        "companyName",
                        "fieldName",
                        "sectorName",
                        "thesisName",
                        "zz",
                        "yy",
                        "xx",
                        "timestamp",
                        "value"
        FROM data_interpolated
        WHERE "source" = 'iFarming'
          AND "refStructureName" = '${refStructureName}'
          AND "companyName" = '${companyName}'
          AND "fieldName" = '${fieldName}'
          AND "sectorName" = '${sectorName}'
          AND "thesisName" = '${thesisName}'
          AND "timestamp" >= '${timestampFrom}'
          AND "timestamp" <= '${timestampTo}'
          AND ("zz" = 0 OR "zz" IS NULL)
        ORDER BY "source", "refStructureName", "companyName", "fieldName", "sectorName", "thesisName", "timestamp", "zz", "yy", "xx"`;

    const results = await sequelize.query(query,
        {
            type: QueryTypes.SELECT,
            bind: {
                refStructureName,
                companyName,
                fieldName,
                sectorName,
                thesisName,
                timestampFrom,
                timestampTo
            }
        }
    );

    return results.map(result => new DataInterpolatedWrapper(
        result.refStructureName,
        result.companyName,
        result.fieldName,
        result.sectorName,
        result.thesisName,
        result.zz,
        result.yy,
        result.xx,
        result.timestamp,
        result.value
    ));
}


class DataInterpolatedRepository {

    constructor(sequelize) {
        this.sequelize = sequelize;
    }

    async findLastInterpolationTimestamp(refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, timestampTo)
    {
        const query = `
            SELECT MAX("timestamp") AS "lastTimestamp"
            FROM data_interpolated
            WHERE "source" = 'iFarming'
              AND "refStructureName" = '${refStructureName}'
              AND "companyName" = '${companyName}'
              AND "fieldName" = '${fieldName}'
              AND "sectorName" = '${sectorName}'
              AND "thesisName" = '${thesisName}'
              AND "timestamp" BETWEEN '${Math.floor(timestampFrom)}' AND '${Math.ceil(timestampTo)}'`;

        const result = await this.sequelize.query(query, {
            type: QueryTypes.SELECT,
            bind: {
                refStructureName,
                companyName,
                fieldName,
                sectorName,
                thesisName,
                timestampFrom,
                timestampTo
            }
        });

        return result.length > 0 ? result[0].lastTimestamp : null;
    }

    async findDataInterpolated(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp) {
        return getResults(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp, timestamp, this.sequelize);
    }

    async findDataInterpolatedRange(refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, timestampTo) {
        return getResults(refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, timestampTo, this.sequelize);
    }

    async findInterpolatedMeans(refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, timestampTo) {

        const query = `
            SELECT "zz", "yy", "xx", AVG(value * -1)::numeric AS mean, STDDEV(value) ::numeric AS std
            FROM data_interpolated
            WHERE "source" = 'iFarming'
              AND "refStructureName" = '${refStructureName}'
              AND "companyName" = '${companyName}'
              AND "fieldName" = '${fieldName}'
              AND "sectorName" = '${sectorName}'
              AND "thesisName" = '${thesisName}'
              AND "timestamp" >= '${timestampFrom}'
              AND "timestamp" <= '${timestampTo}'
              AND "value" < 0
            GROUP BY "zz", "yy", "xx"
            ORDER BY "zz", "yy", "xx"
        `;

        const results = await this.sequelize.query(query,
            {
                type: QueryTypes.SELECT,
                bind: {
                    refStructureName,
                    companyName,
                    fieldName,
                    sectorName,
                    thesisName
                }
            }
        );


        return results.map(result => new DataInterpolatedMeanWrapper(
            result.zz,
            result.yy,
            result.xx,
            result.mean,
            result.std
        ));
    }

    async findThesisPoints(refStructureName, companyName, fieldName, sectorName, thesisName) {

        const query = `
            SELECT "xx", "yy", "zz" 
            FROM data_interpolated
            WHERE "source" = 'iFarming'
                AND "refStructureName" = '${refStructureName}'
                AND "companyName" = '${companyName}'
                AND "fieldName" = '${fieldName}'
                AND "sectorName" = '${sectorName}'
                AND "thesisName" = '${thesisName}'
                AND  "timestamp" = (
                    SELECT MAX(timestamp) 
                    FROM data_interpolated 
                    WHERE "source" = 'iFarming'
                        AND "refStructureName" = '${refStructureName}'
                        AND "companyName" = '${companyName}'
                        AND "fieldName" = '${fieldName}'
                        AND "sectorName" = '${sectorName}'
                        AND "thesisName" = '${thesisName}')
            ORDER BY "xx", "yy", "zz"`;

        const results = await this.sequelize.query(query,
          {
              type: QueryTypes.SELECT,
              bind: {
                  refStructureName,
                  companyName,
                  fieldName,
                  sectorName,
                  thesisName
              }
          }
        );

        const points = results.map(result => new ThesisPoint(
          result.xx,
          result.yy,
          result.zz
        ));

        return new ThesisPoints(points)
    }

}

export default DataInterpolatedRepository;
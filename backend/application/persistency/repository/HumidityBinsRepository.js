import { HumidityBinWrapper } from '../querywrappers/HumidityBinWrapper.js';

import { QueryTypes } from 'sequelize';

class HumidityBinsRepository {

    constructor(sequelize) {
        this.sequelize = sequelize;
    }

    async findHumidityBins(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName) {

        const query = `
            WITH interval_table AS (SELECT unnest(array['6*(-30, 0]', '5*(-100, -30]', '4*(-200, -100]', '3*(-300, -200]', '2*(-1500, -300]', '1*(-∞, -1500]']) AS humidity_bin),
            interpolated_data AS (
                SELECT *
                FROM data_interpolated
                WHERE "timestamp" >= '${timeFilterFrom}'
                    AND "timestamp" <= '${timeFilterTo}'
                    AND "source" = 'iFarming'
                    AND "refStructureName" = '${refStructureName}'
                    AND "companyName" = '${companyName}'
                    AND "fieldName" = '${fieldName}'
                    AND "sectorName" = '${sectorName}'
                    AND "thesisName" = '${thesisName}'
                    AND "value" BETWEEN -10000000 AND 0
                )
            SELECT di."timestamp",
                   di."source",
                   di."refStructureName",
                   di."companyName",
                   di."fieldName",
                   di."sectorName",
                   di."thesisName",
                   it.humidity_bin,
                   COALESCE(count(d."value"), 0) AS count
            FROM interval_table it
                CROSS JOIN (
                SELECT DISTINCT "timestamp", "source", "refStructureName", "companyName", "fieldName", "sectorName", "thesisName"
                FROM interpolated_data
                ) di
                LEFT JOIN
                interpolated_data d
            ON di."timestamp" = d."timestamp"
                AND di."refStructureName" = d."refStructureName"
                AND di."companyName" = d."companyName"
                AND di."fieldName" = d."fieldName"
                AND di."sectorName" = d."sectorName"
                AND di."thesisName" = d."thesisName"
                AND it.humidity_bin = CASE
                WHEN d."value" BETWEEN -30 AND 0 THEN '6*(-30, 0]'
                WHEN d."value" BETWEEN -100 AND -30 THEN '5*(-100, -30]'
                WHEN d."value" BETWEEN -200 AND -100 THEN '4*(-200, -100]'
                WHEN d."value" BETWEEN -300 AND -200 THEN '3*(-300, -200]'
                WHEN d."value" BETWEEN -1500 AND -300 THEN '2*(-1500, -300]'
                WHEN d."value" BETWEEN -10000000 AND -1500 THEN '1*(-∞, -1500]'
                ELSE NULL
            END
            GROUP BY di."timestamp", di."source", di."refStructureName", di."companyName", di."fieldName", di."sectorName", di."thesisName", it.humidity_bin
            ORDER BY di."timestamp", it.humidity_bin
        `

        const results = await this.sequelize.query(query, {
           type: QueryTypes.SELECT,
           bind: {
               timeFilterFrom,
               timeFilterTo,
               refStructureName,
               companyName,
               fieldName,
               sectorName,
               thesisName
           }
        });

        return results.map(result => new HumidityBinWrapper(
            result.refStructureName,
            result.companyName,
            result.fieldName,
            result.sectorName,
            result.thesisName,
            result.timestamp,
            result.count,
            result.humidity_bin
        ));
    }
}

export default HumidityBinsRepository;
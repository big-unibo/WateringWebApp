import { QueryTypes } from 'sequelize';

const HUMIDITY_DEVICE_TYPE = 'SOIL_MOISTURE_GRID'

class HumidityBinsRepository {

    constructor(models,sequelize) {
        this.sequelize = sequelize;
    }

    async getHumidityBins(thesisId, timeFilterFrom, timeFilterTo) {

        const query = `
            WITH validity_table AS (
                SELECT DISTINCT
                    tas.thesis_name,
                    tas.device_id,
                    tas.valid_from,
                    tas.valid_to
                FROM theses_all_signals tas
                WHERE tas.device_type = :HUMIDITY_DEVICE_TYPE
                    AND tas.thesis_id = :thesisId
            ),
            valid_interpolated_profiles_table AS (
                SELECT DISTINCT
                    v.thesis_name,
                    v.device_id,
                    ip.timestamp,
                    ip.x,
                    ip.y,
                    ip.z,
                    ip.value
                FROM validity_table v
                JOIN interpolated_profiles ip 
                    ON ip.profile_id = v.device_id
                    AND ip.timestamp BETWEEN 
                        GREATEST(v.valid_from, :timeFilterFrom)
                        AND LEAST(COALESCE(v.valid_to, 'infinity'), :timeFilterTo)
            ),
            value_bins AS (
            SELECT
                vip.thesis_name,
                vip.device_id,
                vip.timestamp,
                vip.x,
                vip.y,
                vip.z,
                vip.value,
                '(' 
                    || COALESCE(MAX(CASE WHEN b.bound_value < vip.value THEN b.bound_value END)::text, '-∞')
                    || ', '
                    || COALESCE(MIN(CASE WHEN b.bound_value >= vip.value THEN b.bound_value END)::text, '+∞')
                    || ']' AS humidity_bin_description,
                COUNT(CASE WHEN b.bound_value < vip.value THEN 1 END) AS humidity_bin
            FROM valid_interpolated_profiles_table vip
            JOIN devices d
                ON d.id = vip.device_id
            JOIN profiles_bins pb 
                ON pb.id = d.binning_id
            CROSS JOIN LATERAL (
                VALUES (pb.bound_0), (pb.bound_1), (pb.bound_2), (pb.bound_3),
                    (pb.bound_4), (pb.bound_5), (pb.bound_6)
            ) AS b(bound_value)
            GROUP BY
                vip.thesis_name,
                vip.device_id,
                vip.timestamp,
                vip.x,
                vip.y,
                vip.z,
                vip.value
            HAVING 
                vip.value BETWEEN 
                    COALESCE(MIN(b.bound_value), '-infinity'::float8) 
                    AND 
                    COALESCE(MAX(b.bound_value), 'infinity'::float8) 
        )
        SELECT
            thesis_name AS "thesisName",
            device_id AS "deviceId",
            timestamp AS "timestamp",
            humidity_bin_description as "humidityBinDescription",
            humidity_bin as "humidityBin",
            COUNT(*) AS "count"
        FROM value_bins
        GROUP BY
            thesis_name,
            device_id,
            timestamp,
            humidity_bin_description,
            humidity_bin
        ORDER BY
            timestamp ASC;
        `;


        const results = await this.sequelize.query(query, {
            replacements: {
                timeFilterFrom,
                timeFilterTo,
                thesisId,
                HUMIDITY_DEVICE_TYPE
            },
            type: QueryTypes.SELECT
        });  

        return(results);
    }
}

//     async findHumidityBins(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName) {

//         const query = `
//             WITH interval_table AS (SELECT unnest(array['6*(-30, 0]', '5*(-100, -30]', '4*(-200, -100]', '3*(-300, -200]', '2*(-1500, -300]', '1*(-∞, -1500]']) AS humidity_bin),
//             interpolated_data AS (
//                 SELECT *
//                 FROM data_interpolated
//                 WHERE "timestamp" >= '${timeFilterFrom}'
//                     AND "timestamp" <= '${timeFilterTo}'
//                     AND "source" = 'iFarming'
//                     AND "refStructureName" = '${refStructureName}'
//                     AND "companyName" = '${companyName}'
//                     AND "fieldName" = '${fieldName}'
//                     AND "sectorName" = '${sectorName}'
//                     AND "thesisName" = '${thesisName}'
//                     AND "value" BETWEEN -10000000 AND 0
//                 )
//             SELECT di."timestamp",
//                    di."source",
//                    di."refStructureName",
//                    di."companyName",
//                    di."fieldName",
//                    di."sectorName",
//                    di."thesisName",
//                    it.humidity_bin,
//                    COALESCE(count(d."value"), 0) AS count
//             FROM interval_table it
//                 CROSS JOIN (
//                 SELECT DISTINCT "timestamp", "source", "refStructureName", "companyName", "fieldName", "sectorName", "thesisName"
//                 FROM interpolated_data
//                 ) di
//                 LEFT JOIN
//                 interpolated_data d
//             ON di."timestamp" = d."timestamp"
//                 AND di."refStructureName" = d."refStructureName"
//                 AND di."companyName" = d."companyName"
//                 AND di."fieldName" = d."fieldName"
//                 AND di."sectorName" = d."sectorName"
//                 AND di."thesisName" = d."thesisName"
//                 AND it.humidity_bin = CASE
//                 WHEN d."value" BETWEEN -30 AND 0 THEN '6*(-30, 0]'
//                 WHEN d."value" BETWEEN -100 AND -30 THEN '5*(-100, -30]'
//                 WHEN d."value" BETWEEN -200 AND -100 THEN '4*(-200, -100]'
//                 WHEN d."value" BETWEEN -300 AND -200 THEN '3*(-300, -200]'
//                 WHEN d."value" BETWEEN -1500 AND -300 THEN '2*(-1500, -300]'
//                 WHEN d."value" BETWEEN -10000000 AND -1500 THEN '1*(-∞, -1500]'
//                 ELSE NULL
//             END
//             GROUP BY di."timestamp", di."source", di."refStructureName", di."companyName", di."fieldName", di."sectorName", di."thesisName", it.humidity_bin
//             ORDER BY di."timestamp", it.humidity_bin
//         `

//         const results = await this.sequelize.query(query, {
//            type: QueryTypes.SELECT,
//            bind: {
//                timeFilterFrom,
//                timeFilterTo,
//                refStructureName,
//                companyName,
//                fieldName,
//                sectorName,
//                thesisName
//            }
//         });

//         return results.map(result => new HumidityBinWrapper(
//             result.refStructureName,
//             result.companyName,
//             result.fieldName,
//             result.sectorName,
//             result.thesisName,
//             result.timestamp,
//             result.count,
//             result.humidity_bin
//         ));
//     }
// }

export default HumidityBinsRepository;
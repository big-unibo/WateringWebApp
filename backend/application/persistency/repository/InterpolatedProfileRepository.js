import { QueryTypes} from 'sequelize'
import { HUMIDITY_DEVICE_TYPE } from '../../commons/constants.js';

class InterpolatedProfileRepository {

    constructor(models, sequelize){
        this.sequelize = sequelize;
    }

    async getInterpolatedProfiles(thesisId, timeFilterFrom, timeFilterTo) {

        const query = `
            WITH validity_table AS (
                SELECT DISTINCT
                    tas.thesis_name,
                    tas.device_id,
                    tas.device_binning_id,
                    tas.valid_from,
                    tas.valid_to
                FROM theses_all_signals tas
                WHERE tas.device_type = :HUMIDITY_DEVICE_TYPE
                AND tas.thesis_id = :thesisId
            )
            SELECT DISTINCT
                v.thesis_name AS "thesisName",
                v.device_id AS "deviceId",
                v.device_binning_id AS "binningId",
                ip.timestamp AS "timestamp",
                ip.x AS "x",
                ip.y AS "y",
                ip.z AS "z",
                ip.value AS "value"
            FROM validity_table v
            JOIN interpolated_profiles ip 
                ON ip.grid_id = v.device_id
                AND ip.timestamp BETWEEN 
                    GREATEST(v.valid_from, :timeFilterFrom)
                    AND LEAST(COALESCE(v.valid_to, 'infinity'), :timeFilterTo)
            ORDER BY ip.timestamp ASC;
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

        return results;
    }

    async getInterpolatedMeans(thesisId, timeFilterFrom, timeFilterTo) {

        const query = `
            WITH validity_table AS (
                SELECT DISTINCT
                    tas.thesis_name,
                    tas.device_id,
                    tas.device_binning_id,
                    tas.valid_from,
                    tas.valid_to
                FROM theses_all_signals tas
                WHERE tas.device_type = :HUMIDITY_DEVICE_TYPE
                AND tas.thesis_id = :thesisId
            )
            SELECT DISTINCT
                v.thesis_name AS "thesisName",
                v.device_id AS "deviceId",
                v.device_binning_id AS "binningId",
                ip.x AS "x",
                ip.y AS "y",
                ip.z AS "z",
                AVG(ip.value * -1)::numeric AS mean, 
                STDDEV(ip.value) ::numeric AS std
            FROM validity_table v
            JOIN interpolated_profiles ip 
                ON ip.grid_id = v.device_id
                AND ip.timestamp BETWEEN 
                    GREATEST(v.valid_from, :timeFilterFrom)
                    AND LEAST(COALESCE(v.valid_to, 'infinity'), :timeFilterTo)
            GROUP BY v.thesis_name, v.device_id , v.device_binning_id, ip.x, ip.y, ip.z
            ORDER BY ip.timestamp ASC;
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

        return results;
    }


    async findLastInterpolationTimestamp(thesisId, timestampFrom, timestampTo)
    {
        const query = `
            SELECT MAX("timestamp") AS "lastTimestamp"
            FROM interpolated_profiles
            WHERE grid_id IN (SELECT device_id FROM theses_all_signals
                                    WHERE device_type = :HUMIDITY_DEVICE_TYPE 
                                        AND thesis_id = :thesisId
                                        AND valid_from < :timestampTo AND (valid_to > :timestampFrom OR valid_to IS NULL))
                AND timestamp BETWEEN :timestampFrom AND :timestampTo
            `;

        const result = await this.sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: {
                HUMIDITY_DEVICE_TYPE,
                thesisId,
                timestampFrom,
                timestampTo
            }
        });

        return result.length > 0 ? result[0].lastTimestamp : null;
    }
}

export default InterpolatedProfileRepository
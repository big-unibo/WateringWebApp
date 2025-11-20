import { QueryTypes } from 'sequelize'
import { HUMIDITY_DEVICE_TYPE } from '../../commons/constants.js';

class InterpolatedProfileRepository {

    constructor(models, sequelize) {
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
                ic.x AS "x",
                ic.y AS "y",
                ic.z AS "z",
                ic.value AS "value"
            FROM validity_table v
            JOIN interpolated_profiles ip 
                ON ip.grid_id = v.device_id
                AND ip.timestamp BETWEEN 
                    GREATEST(v.valid_from, :timeFilterFrom)
                    AND LEAST(COALESCE(v.valid_to, 'infinity'), :timeFilterTo)
            JOIN interpolated_cells ic
                ON ip.id = ic.profile_id
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
                ic.x AS "x",
                ic.y AS "y",
                ic.z AS "z",
                AVG(ic.value)::numeric AS mean, 
                STDDEV(ic.value) ::numeric AS std
            FROM validity_table v
            JOIN interpolated_profiles ip 
                ON ip.grid_id = v.device_id
                AND ip.timestamp BETWEEN 
                    GREATEST(v.valid_from, :timeFilterFrom)
                    AND LEAST(COALESCE(v.valid_to, 'infinity'), :timeFilterTo)
            JOIN interpolated_cells ic
                ON ip.id = ic.profile_id
            GROUP BY v.thesis_name, v.device_id , v.device_binning_id, ic.x, ic.y, ic.z
            ORDER BY ic.z, ic.y, ic.x
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


    async findLastInterpolationTimestamp(thesisId, timestampFrom, timestampTo) {
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

    async findThesisPoints(gridId) {

        const query = `
            SELECT "x", "y", "z" 
            FROM interpolated_profiles
            WHERE grid_id = :gridId
                AND  timestamp = (
                    SELECT MAX(timestamp) 
                    FROM interpolated_profiles
                    WHERE grid_id = :gridId
                )
            ORDER BY "x", "y", "z"`;

        const results = await this.sequelize.query(query,
            {
                type: QueryTypes.SELECT,
                replacements: {
                    gridId
                }
            }
        );
        return results;
    }
}

export default InterpolatedProfileRepository
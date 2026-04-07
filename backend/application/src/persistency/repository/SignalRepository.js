import { Op } from "sequelize";

class SignalRepository {
    constructor(models, sequelize) {
        this.Signal = models.Signal
        this.DevicesSignals = models.DevicesSignals
        this.Measurement = models.Measurement
        this.Provider = models.Provider
        this.SignalsDenormalized = models.SignalsDenormalized
        this.ThesesAllSignals = models.ThesesAllSignals
        this.SignalType = models.SignalType
        this.ThesesAllSignals.removeAttribute('id')
        this.SignalsDenormalized.removeAttribute('id')
        this.sequelize = sequelize
    }

    async createSignal(signalData) {
        try {
            const createdSignal = await this.Signal.create(
                { ...signalData }
            );

            return createdSignal.id;
        } catch (error) {
            throw new Error(`Error creating signals caused by: ${error.message}`);
        }
    }

    async disableSignal(signalId, validTo) {
        try {
            await this.Signal.update(
                {
                    disabledAt: validTo
                },
                {
                    where: {
                        id: signalId,
                        disabledAt: {
                            [Op.is]: null
                        }
                    }
                }
            );
        } catch (error) {
            throw new Error(`Error disabling signal caused by: ${error.message}`);
        }
    }

    async disableSignalInDevices(signalId, validTo) {
        try {
            const [updatedCount, updatedRecords] = await this.DevicesSignals.update(
                {
                    validTo: validTo
                },
                {
                    where: {
                        signalId: signalId,
                        validFrom: {
                            [Op.lt]: validTo
                        },
                        validTo: {
                            [Op.or]: [
                                { [Op.is]: null },
                                { [Op.gt]: validTo }
                            ]
                        }
                    },
                    returning: true
                }
            );

            if (updatedCount > 0) {
                return updatedRecords.map(record => record.id);
            }

            return [];
        } catch (error) {
            throw new Error(`Error while disabling signal in devices caused by: ${error.message}`);
        }
    }

    async updateSignal(signalId, updates) {
        try {
            const signal = await this.Signal.findByPk(signalId);
            if (!signal) throw new Error("Signal not found");
            return await signal.update(updates);
        } catch (error) {
            throw new Error(`Error while updating signal caused by: ${error.message}`);
        }
    }

    async addMeasurements(signalId, measurements) {
        try {
            const signal = await this.Signal.findByPk(signalId);
            if (!signal) throw new Error("Signal not found");
            await this.Measurement.bulkCreate(measurements);
        } catch (error) {
            throw new Error(`Error while creating measurements: ${error.message}`);
        }
    }

    async countSignals(filteringIds, timeFilterFrom, timeFilterTo, providerIds, typeIds, companyIds, deviceIds){

        const query = ` SELECT COUNT(DISTINCT id) AS total
            FROM signals s
            JOIN devices_signals_denormalized ds ON ds.signal_id = s.id
            WHERE created_at < :timeFilterTo
                AND COALESCE(disabled_at, 'infinity') > :timeFilterFrom
                ${providerIds?.length > 0 ? "AND s.provider_id = ANY(ARRAY[:providerIds]::int[])" : ""}
                ${companyIds?.length > 0 ? "AND device_company_id = ANY(ARRAY[:companyIds]::int[])" : ""}
                ${deviceIds?.length > 0 ? "AND device_id = ANY(ARRAY[:deviceIds]::int[])" : ""}
                ${typeIds?.length > 0 ? "AND type_id = ANY(ARRAY[:typeIds]::int[])" : ""}
                AND ${filteringIds === null
                ? 'TRUE'
                : filteringIds.length === 0
                    ? 'FALSE'
                    : 'id = ANY(ARRAY[:filteringIds])'}`
        try {
            const [results] = await this.sequelize.query(query, {
                replacements: { timeFilterFrom, timeFilterTo, providerIds, typeIds, companyIds, deviceIds, filteringIds },
                type: this.sequelize.QueryTypes.SELECT
            });
            return Number(results.total);
        } catch (error) {
            console.error(`Fail counting signals data: ${error.message}`);
            throw error;
        }
    }

    async getSignals(filteringIds, timeFilterFrom, timeFilterTo, providerIds, typeIds, companyIds, deviceIds, offset, limit) {
        const query = `WITH paginated_signals AS (
            SELECT DISTINCT id, created_at AS "createdAt", disabled_at AS "disabledAt"
            FROM signals s
            JOIN devices_signals_denormalized ds ON ds.signal_id = s.id
            WHERE created_at < :timeFilterTo
                AND COALESCE(disabled_at, 'infinity') > :timeFilterFrom
                ${providerIds?.length > 0 ? "AND s.provider_id = ANY(ARRAY[:providerIds]::int[])" : ""}
                ${companyIds?.length > 0 ? "AND device_company_id = ANY(ARRAY[:companyIds]::int[])" : ""}
                ${deviceIds?.length > 0 ? "AND device_id = ANY(ARRAY[:deviceIds]::int[])" : ""}
                ${typeIds?.length > 0 ? "AND type_id = ANY(ARRAY[:typeIds]::int[])" : ""}
                AND ${filteringIds === null
                ? 'TRUE'
                : filteringIds.length === 0
                    ? 'FALSE'
                    : 'id = ANY(ARRAY[:filteringIds])'}
            ORDER BY id
            LIMIT :limit
            OFFSET :offset
        )
        SELECT DISTINCT
            s.provider_id AS "providerId",
            s.signal_id_on_provider AS "idOnProvider",
            s.signal_id AS "signalId",
            s.signal_description AS "signalDescription",
            s.signal_type AS "signalType",
            s.signal_type_description AS "signalTypeDescription",
            s.sensor_technology AS "sensorTechnology",
            m.measurement_timestamp AS "lastMeasurementTimestamp",
            s.virtual,
            s.unit,
            s.x, s.y, s.z,
            ps."createdAt",
            ps."disabledAt"
        FROM devices_signals_denormalized s
        JOIN paginated_signals ps ON ps.id = s.signal_id
        JOIN LATERAL (
            SELECT MAX(timestamp) AS measurement_timestamp
            FROM measurements m
            WHERE m.signal_id = s.signal_id
        ) m ON true`

        try {
            const results = await this.sequelize.query(query, {
                replacements: { timeFilterFrom, timeFilterTo, providerIds, typeIds, companyIds, offset, deviceIds, limit, filteringIds},
                type: this.sequelize.QueryTypes.SELECT
            });
            return results;
        } catch (error) {
            console.error(`Fail retrieving signals data: ${error.message}`);
            throw error;
        }
    }

    async getSignalInfo(signalId, timestamp) {
        try {
            const signalInfo = await this.SignalsDenormalized.findAll({
                where: {
                    signalId: signalId,
                    validFrom: { [Op.lt]: timestamp },
                    [Op.or]: [
                        { validTo: { [Op.gt]: timestamp } },
                        { validTo: null }
                    ]
                },
                raw: true   
            })   
            if (!signalInfo) {
                return null
            }
            const lastMeasurementTimestamp = await this.Measurement.findOne({
                where: { signalId: signalId },
                order: [['timestamp', 'DESC']],
                attributes: ['timestamp'],
                raw: true
            })

            const validity = await this.Signal.findByPk(signalId, {
                attributes: ['createdAt', 'disabledAt'],
                raw: true
            })
            return signalInfo.map(signal => ({...signal, lastMeasurementTimestamp: lastMeasurementTimestamp?.timestamp || null, ...validity}))
        } catch (error) {
            throw new Error(`Error while retrieving signal info caused by: ${error.message}`);
        }   
    }

    async getSignalAssociationEntries(signalId, timestamp, userId, isAdmin) {
        try {
            const query = `
                SELECT thesis_id AS "thesisId", thesis_name AS "thesisName", tas.sector_id AS "sectorId",
                    sector_name AS "sectorName", farm_id AS "farmId", farm_name AS "farmName",
                    association_type AS "associationType"
                FROM theses_all_signals tas
                LEFT JOIN (SELECT DISTINCT sector_id FROM master_data_permits WHERE user_id = :userId) p ON tas.sector_id = p.sector_id
                WHERE signal_id = :signalId
                    AND valid_from < :timestamp
                    AND COALESCE(valid_to, 'infinity') > :timestamp
                    AND (:isAdmin = true OR p.sector_id IS NOT NULL)
            `
            const signalAssociations = await this.sequelize.query(query, {
                replacements: { signalId, timestamp, userId, isAdmin},
                type: this.sequelize.QueryTypes.SELECT
            })
            return signalAssociations
        } catch (error) {
            throw new Error(`Error while finding signals associations: ${error.message}`);
        }
    }

    async signalExists(signalId) {
        const count = await this.Signal.count({
            where: { id: signalId }
        });
        return count > 0;
    }

    async getProviders() {
        try {
            const providers = await this.Provider.findAll();
            return providers
        } catch {
            throw new Error(`Error while retrieving providers data caused by: ${error.message}`);
        }
    }

    async getSignalTypes() {
        try {
            const signalTypes = await this.SignalType.findAll();
            return signalTypes;
        } catch (error) {
            throw new Error(`Error while retrieving signals types data caused by: ${error.message}`);
        }
    }

    async deleteSignal(signalId){
        try{
            await this.DevicesSignals.destroy({
                where: { signalId: signalId }
            })
            await this.Measurement.destroy({
                where: { signalId: signalId }
            })
            await this.Signal.destroy({
                where: {
                    id: signalId
                }
            })
        } catch (error) {
            throw new Error(`Error deleting signal coused by: ${error.message}`);
        }
    }
}

export default SignalRepository;
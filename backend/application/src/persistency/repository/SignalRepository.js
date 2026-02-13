import { Op } from "sequelize";

class SignalRepository {
    constructor(models, sequelize) {
        this.Signal = models.Signal
        this.DevicesSignals = models.DevicesSignals
        this.Measurement = models.Measurement
        this.Provider = models.Provider;
        this.SignalsDenormalized = models.SignalsDenormalized
        this.ThesesAllSignals = models.ThesesAllSignals
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
            return signalInfo.map(signal => ({...signal, lastMeasurementTimestamp: lastMeasurementTimestamp?.timestamp || null}))
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
}

export default SignalRepository;
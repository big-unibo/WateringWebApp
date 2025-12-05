import { Op } from "sequelize";
import { CreateSignal } from "../../dtos/deviceDto.js";

class SignalRepository {
    constructor(models, sequelize) {
        this.Signal = models.Signal;
        this.SignalInField = models.SignalInField;
        this.SignalInSector = models.SignalInSector;
        this.SignalInThesis = models.SignalInThesis;
        this.Measurement = models.Measurement;
        this.sequelize = sequelize;
    }

    /**
     * Bulk create signals for a device
     * @param {Number} deviceId - Id of the device
     * @param {Array<CreateSignal>} signalsData - List of signals
     */
    async createSignals(deviceId, signalsData = []) {
        try {
            if (!Array.isArray(signalsData) || signalsData.length === 0) {
                return [];
            }
            return await this.Signal.bulkCreate(signalsData.map(sig => ({ ...sig, deviceId: deviceId })));
        } catch (error) {
            throw new Error(`Error creating signals caused by: ${error.message}`);
        }
    }

    async assignSignalToField(associationData) {
        try {
            await this.SignalInField.create({
                signalId: associationData.signalId,
                fieldId: associationData.fieldId,
                validFrom: associationData.validFrom
            });
        } catch (error) {
            throw new Error(`Error creating association between signal and field: ${error.message}`);
        }
    }

    async assignSignalToSector(associationData) {
        try {
            await this.SignalInSector.create({
                signalId: associationData.signalId,
                sectorId: associationData.sectorId,
                validFrom: associationData.validFrom
            });
        } catch (error) {
            throw new Error(`Error creating association between signal and sector: ${error.message}`);
        }
    }

    async assignSignalToThesis(associationData) {
        try {
            await this.SignalInThesis.create({
                signalId: associationData.signalId,
                thesisId: associationData.thesisId,
                validFrom: associationData.validFrom
            });
        } catch (error) {
            throw new Error(`Error creating association between signal and thesis: ${error.message}`);
        }
    }

    async getThesisAssociatedSignals(thesisId, timestamp) {
        try {
            const associations = await this.SignalInThesis.findAll({
                where: {
                    thesisId: thesisId,
                    validFrom: {
                        [Op.lte]: timestamp
                    },
                    [Op.or]: [
                        { validTo: { [Op.gt]: timestamp } },
                        { validTo: null }
                    ]
                },
                include: [{
                    model: this.Signal,
                    required: true,
                    as: "signal"
                }]
            });

            return associations.map(association => {
                if (association.signal) {
                    return association.signal.get({ plain: true });
                }
                return null;
            }).filter(s => s !== null);

        } catch (error) {
            throw new Error(`Error while retrieving thesis signals: ${error.message}`);
        }
    }

    async getSectorAssociatedSignals(sectorId, timestamp) {
        try {
            const associations = await this.SignalInSector.findAll({
                where: {
                    sectorId: sectorId,
                    validFrom: {
                        [Op.lte]: timestamp
                    },
                    [Op.or]: [
                        { validTo: { [Op.gt]: timestamp } },
                        { validTo: null }
                    ]
                },
                include: [{
                    model: this.Signal,
                    required: true,
                    as: "signal"
                }]
            });

            return associations.map(association => {
                if (association.signal) {
                    return association.signal.get({ plain: true });
                }
                return null;
            }).filter(s => s !== null);

        } catch (error) {
            throw new Error(`Error while retrieving sectors signals: ${error.message}`);
        }
    }



    async updateSignal(signalId, updates) {
        try {
            const signal = await this.Signal.findByPk(signalId);
            if (!signal) throw new Error("Signal not found");
            await signal.update(updates);
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

    _getValidityConditions(signalId, validTo) {
        return {
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
        };
    }

    async disableSignalInThesis(signalId, validTo) {
        try {
            return await this.SignalInThesis.update(
                { validTo: validTo },
                { where: this._getValidityConditions(signalId, validTo) }
            );
        } catch (error) {
            throw new Error(`Error disabling signal in Thesis: ${error.message}`);
        }
    }

    async disableSignalInSector(signalId, validTo) {
        try {
            return await this.SignalInSector.update(
                { validTo: validTo },
                { where: this._getValidityConditions(signalId, validTo) }
            );
        } catch (error) {
            throw new Error(`Error disabling signal in Sector: ${error.message}`);
        }
    }

    async disableSignalInField(signalId, validTo) {
        try {
            return await this.SignalInField.update(
                { validTo: validTo },
                { where: this._getValidityConditions(signalId, validTo) }
            );
        } catch (error) {
            throw new Error(`Error disabling signal in Field: ${error.message}`);
        }
    }

    async disableSignal(signalId, validTo) {
        try {
            const signal = await this.Signal.findByPk(signalId);
            if (!signal) throw new Error("Signal not found");

            await Promise.all([
                this.disableSignalInThesis(signalId, validTo),
                this.disableSignalInSector(signalId, validTo),
                this.disableSignalInField(signalId, validTo)
            ]);

        } catch (error) {
            throw error;
        }
    }
}

export default SignalRepository;
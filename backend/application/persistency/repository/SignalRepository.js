import { Op } from "sequelize";

class SignalRepository {
    constructor(models, sequelize){
        this.Signal = models.Signal;
        this.SignalInField = models.SignalInField;
        this.SignalInSector = models.SignalInSector;
        this.SignalInThesis = models.SignalInThesis;
        this.Measurement = models.Measurement;
        this.sequelize = sequelize;
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

    async updateSignal(signalId, updates) {
        try{
            const signal = await this.Signal.findByPk(signalId);
            if(!signal) throw new Error("Signal not found");
            await signal.update(updates);
        }catch (error){
           throw new Error(`Error while updating signal caused by: ${error.message}`);
        }
    }

    async addMeasurements(signalId,measurements){
        try{
            const signal = await this.Signal.findByPk(signalId);
            if(!signal) throw new Error("Signal not found");
            await this.Measurement.bulkCreate(measurements);
        }catch (error){
           throw new Error(`Error while creating measurements: ${error.message}`);
        }
    }

    async disableSignal(signalId, validTo){
        try{
            const signal = await this.Signal.findByPk(signalId);
            if(!signal) throw new Error("Signal not found");
            await this.SignalInThesis.update({
                validTo: validTo
            },{
                where: {
                    signalId: signalId,
                    validFrom: {
                        [Op.lt]: validTo
                    },
                    validTo: {
                        [Op.or]: {
                            [Op.is]: null,
                            [Op.gt]: validTo
                        },
                    }
                }
            })
            await this.SignalInSector.update({
                validTo: validTo
            },{
                where: {
                    signalId: signalId,
                    validFrom: {
                        [Op.lt]: validTo
                    },
                    validTo: {
                        [Op.or]: {
                            [Op.is]: null,
                            [Op.gt]: validTo
                        },
                    }
                }
            })
            await this.SignalInField.update({
                validTo: validTo
            },{
                where: {
                    signalId: signalId,
                    validFrom: {
                        [Op.lt]: validTo
                    },
                    validTo: {
                        [Op.or]: {
                            [Op.is]: null,
                            [Op.gt]: validTo
                        },
                    }
                }
            })
        }catch (error){
           throw new Error(`Error while disabling signal caused by: ${error.message}`);
        }
    }
}

export default SignalRepository;
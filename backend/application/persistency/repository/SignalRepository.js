class SignalRepository {
    constructor(models, sequelize){
        this.Signal = models.Signal;
        this.SignalInField = models.SignalInField;
        this.SignalInSector = models.SignalInSector;
        this.SignalInThesis = models.SignalInThesis;
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
}

export default SignalRepository;
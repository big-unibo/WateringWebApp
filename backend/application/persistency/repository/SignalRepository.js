class SignalRepository {
    constructor(models, sequelize){
        this.SignalInField = models.SignalInField;
        this.SignalInSector = models.SignalInSector;
        this.SignalInThesis = models.SignalInThesis;
        this.sequelize = sequelize;
    }
    
    async associateSignalToField(associationData) {
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

    async associateSignalToSector(associationData) {
        try {
            await this.SignalInField.create({
                signalId: associationData.signalId,
                sectorId: associationData.sectorId,
                validFrom: associationData.validFrom
            });
        } catch (error) {
            throw new Error(`Error creating association between signal and sector: ${error.message}`);
        }
    }

    async associateSignalToThesis(associationData) {
        try {
            await this.SignalInField.create({
                signalId: associationData.signalId,
                thesisId: associationData.thesisId,
                validFrom: associationData.validFrom
            });
        } catch (error) {
            throw new Error(`Error creating association between signal and thesis: ${error.message}`);
        }
    }
}

export default SignalRepository;
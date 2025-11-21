import { Op, Sequelize } from 'sequelize';

class WateringAdviceRepository {

    constructor(models, sequelize) {
        this.Advice = models.Advice
        this.Thesis = models.Thesis
        this.WateringAlgorithmParams = models.WateringAlgorithmParams
        this.sequelize = sequelize
    }
    
    async getThesisLastWateringAdvice(thesisId, timestamp){
        return await this.Advice.findOne({
            where: {
                thesisId: thesisId,
                watering_start: {
                    [Op.lt] : timestamp
                }
            },
            include: [{
               model: this.Thesis,
               as: "thesis",
               attributes: []
            }],
            attributes: {
                include: [
                    [Sequelize.col("thesis.thesis_name"), "thesisName"]
                ]
            },
            raw: true,
            order: [["wateringStart", 'DESC']]            
        })
    }

    async getWateringAlgorithmParams(thesisId, timestamp) {

        return await this.WateringAlgorithmParams.findOne({
            where: {
                thesisId: thesisId,
                validFrom: { [Op.lt]: timestamp },
                validTo: {
                    [Op.or]: {
                        [Op.is]: null,
                        [Op.gt]: timestamp
                    },
                }
            },
            raw: true
        })
    }

        
    async setWateringAlgorithmParams(thesisId, wateringParams, validFrom, validTo){

        try{
            const oldParams = await this.getWateringAlgorithmParams(thesisId, validFrom)

            await this.WateringAlgorithmParams.update(
                { 
                    validTo: validFrom,
                },
                {
                    where: {
                        thesisId: thesisId,
                        validFrom: { [Op.lt]: validFrom },
                        validTo: {
                            [Op.or]: {
                                [Op.is]: null,
                                [Op.gt]: validFrom
                            },
                        }
                    }
                }
            )

            const model = this.WateringAlgorithmParams.create({
                thesisId: thesisId,
                validFrom: validFrom,
                validTo: validTo,
                maxWatering: wateringParams.maxWatering ?? oldParams.maxWatering,
                minWatering: wateringParams.minWatering ?? oldParams.minWatering, 
                wateringBaseline: wateringParams.wateringBaseline ?? oldParams.wateringBaseline,
                wateringFrequency: wateringParams.wateringFrequency ?? oldParams.wateringFrequency,
                ki: wateringParams.ki ?? oldParams.ki,
                kp: wateringParams.kp ?? oldParams.kp,
                errorFunction: wateringParams.errorFunction ?? oldParams.errorFunction,
                description: wateringParams.description
            });
        } catch (error) {
            throw new Error(`Error setting watering algorithm parameters: ${error.message}`);
        }
    }
}

export default WateringAdviceRepository;
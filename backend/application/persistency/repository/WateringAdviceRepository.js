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
}

export default WateringAdviceRepository;
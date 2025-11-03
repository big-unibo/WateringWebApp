import { Model, Op } from 'sequelize';

class WateringAdviceRepository {

    constructor(models, sequelize) {
        this.Advice = models.Advice
        this.Thesis = models.Thesis
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
               as: "thesis" 
            }],
            order: [["wateringStart", 'DESC']]            
        })
    }
}

export default WateringAdviceRepository;
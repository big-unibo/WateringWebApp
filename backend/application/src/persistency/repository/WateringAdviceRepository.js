import { Op, Sequelize, QueryTypes } from 'sequelize';
import { _deleteFromModelByParams } from '../../commons/repositoryUtils.js';

class WateringAdviceRepository {

    constructor(models, sequelize) {
        this.Advice = models.Advice
        this.Thesis = models.Thesis
        this.WateringAlgorithmParams = models.WateringAlgorithmParams
        this.sequelize = sequelize
    }

    async getThesisLastWateringAdvice(thesisId, timestamp) {
        return await this.Advice.findOne({
            where: {
                thesisId: thesisId,
                watering_start: {
                    [Op.lt]: timestamp
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

    async getSectorWateringFrequency(sectorId, timefilterFrom, timefilterTo) {
        const query = `
            SELECT DISTINCT 
                wad.watering_frequency as "wateringFrequency",
                wad.valid_from as "validFrom",
                wad.valid_to as "validTo"
            FROM watering_algorithm_params wad
            JOIN theses_in_sectors tis ON tis.thesis_id = wad.thesis_id
            WHERE tis.sector_id = :sectorId
                AND tis.valid_from < :timefilterTo
                AND ( tis.valid_to IS NULL OR tis.valid_to > :timefilterFrom )
            ORDER BY wad.valid_from ASC
        `;

        const results = await this.sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: {
                sectorId,
                timefilterFrom,
                timefilterTo,
            }
        });

        return results;
    }


    async setWateringAlgorithmParams(thesisId, wateringParams, validFrom, validTo) {

        try {
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

            const model = await this.WateringAlgorithmParams.create({
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

            return model.id;
        } catch (error) {
            throw new Error(`Error setting watering algorithm parameters: ${error.message}`);
        }
    }

    async setWateringAlgorithmParamsEndDate(thesisId, timestamp) {
        try {
            const [updatedCount, updatedRecords] = await this.WateringAlgorithmParams.update(
                {
                    validTo: timestamp
                },
                {
                    where: {
                        thesisId: thesisId,
                        validFrom: {
                            [Op.lt]: timestamp
                        },
                        validTo: {
                            [Op.is]: null
                        },
                    },
                    returning: true 
                }
            );

            if (updatedRecords && updatedRecords.length > 0) {
                return updatedRecords[0].id;
            }

        } catch (error) {
            throw new Error(`Error ending watering algorithm params validity: ${error.message}`);
        }
    }

    async deleteWateringAlgorithmParams(thesisId) {
        try {
            return await _deleteFromModelByParams(this.WateringAlgorithmParams, {
                thesisId: thesisId
            })
        } catch (error) {
            throw new Error(`Error deleting watering algorithm parameters: ${error.message}`);
        }
    }

    async deleteWateringAdvices(thesisId) {
        try {
            await this.Advice.destroy({
                where: {
                    thesisId: thesisId
                }
            });
        } catch (error) {
            throw new Error(`Error deleting advices for thesis: ${error.message}`);
        }
    }
}

export default WateringAdviceRepository;
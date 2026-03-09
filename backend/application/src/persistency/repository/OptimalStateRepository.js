import { Op, Sequelize, QueryTypes } from 'sequelize';

class OptimalStateRepository {

    constructor(models, sequelize) {
        this.GridOptimalProfileAssignment = models.GridOptimalProfileAssignment
        this.OptimalProfile = models.OptimalProfile
        this.sequelize = sequelize
    }


    async createMatrixOptimalState(gridId, validFrom, validTo, stopPercentage, optimalDryBound, optimalWetBound, profileId) {
        try {
            let newMatrixId
            if (profileId) {
                const result = await this.GridOptimalProfileAssignment.findAll({
                    where: {
                        optimalProfileId: profileId
                    }
                })
                if (result.length > 0) {
                    newMatrixId = profileId
                } else {
                    throw Error("Optimal profile not found")
                }
            } else {
                const maxId = await this.GridOptimalProfileAssignment.max('optimalProfileId')
                newMatrixId = (maxId ?? 0) + 1;
            }
            console.log(gridId)

            await this.GridOptimalProfileAssignment.update(
                {
                    validTo: Math.floor(validFrom)
                },
                {
                    where: {
                        gridId: gridId,
                        validFrom: {
                            [Op.lt]: validFrom
                        },
                        validTo: {
                            [Op.or]: {
                                [Op.is]: null,
                                [Op.gt]: validFrom
                            },
                        }
                    }
                }
            )

            const model = this.GridOptimalProfileAssignment.build({
                gridId: gridId,
                optimalProfileId: newMatrixId,
                validFrom: validFrom,
                validTo: validTo ? Math.floor(validTo) : null,
                stopPercentage: stopPercentage ?? null,
                optimalDryBound: optimalDryBound ?? null,
                optimalWetBound: optimalWetBound ?? null
            })

            await model.save()
            return {
                matrixId: newMatrixId,
                optimalProfileAssignmentId: model.id
            }
        } catch (error) {
            throw Error(error.message)
        }
    }

    async createOptimalProfileCell(profileId, x, y, z, value, weight) {
        const model = this.OptimalProfile.build({ profileId: profileId, x: x, y: y, z: z, value: value, weight: weight })
        this.OptimalProfile.removeAttribute('id')
        return await model.save()
    }

    async setOptimalProfileAssignmentEndDate(gridId, timestamp) {
        try {
            const [updatedCount, updatedRecords] = await this.GridOptimalProfileAssignment.update(
                {
                    validTo: timestamp
                },
                {
                    where: {
                        gridId: gridId,
                        validFrom: {
                            [Op.lt]: timestamp
                        },
                        validTo: {
                            [Op.is]: null
                        },
                    },
                    returning: true,
                }
            );

            if (updatedRecords && updatedRecords.length > 0) {
                return updatedRecords[0].id;
            }

            return null;

        } catch (error) {
            throw new Error(`Error setting validty end of the optimal profie: ${error.message}`);
        }
    }

}

export default OptimalStateRepository
import { Op, Sequelize } from 'sequelize';
import { getErrorMessage } from '../../commons/utils.js';
import { _deleteFromModelByParams } from '../../commons/repositoryUtils.js';
import { GridOptimalProfileAssignmentModel } from '../model/GridOptimalProfileAssignmentModel.js';
import { OptimalProfileModel } from '../model/OptimalProfileModel.js';


interface OptimalStateModels {
    GridOptimalProfileAssignment: typeof GridOptimalProfileAssignmentModel;
    OptimalProfile: typeof OptimalProfileModel;
}

interface OptimalProfileAssignmentResult {
    matrixId: number;
    optimalProfileAssignmentId: number;
}

class OptimalStateRepository {
    private readonly GridOptimalProfileAssignment: typeof GridOptimalProfileAssignmentModel;
    private readonly OptimalProfile: typeof OptimalProfileModel;
    private readonly sequelize: Sequelize;

    constructor(
        models: OptimalStateModels,
        sequelize: Sequelize,
    ) {
        this.GridOptimalProfileAssignment = models.GridOptimalProfileAssignment;
        this.OptimalProfile = models.OptimalProfile;
        this.sequelize = sequelize;
    }

    async createMatrixOptimalState(
        gridId: number,
        validFrom: number,
        validTo: number | null,
        stopThreshold: number | null,
        optimalDryBound: number | null,
        optimalWetBound: number | null,
        optimalTolerance: number | null,
        profileId?: number,
    ): Promise<OptimalProfileAssignmentResult> {
        try {
            let newMatrixId: number;

            this.OptimalProfile.removeAttribute('id');

            if (profileId) {
                const result = await this.OptimalProfile.findAll({
                    where: { profileId },
                });

                if (result.length > 0) {
                    newMatrixId = profileId;
                } else {
                    throw new Error('Optimal profile not found');
                }
            } else {
                const maxId = await this.OptimalProfile.max<number, OptimalProfileModel>('profileId');
                newMatrixId = (maxId ?? 0) + 1;
            }

            await this.GridOptimalProfileAssignment.update(
                {
                    validTo: Math.floor(validFrom),
                },
                {
                    where: {
                        gridId,
                        validFrom: {
                            [Op.lt]: validFrom,
                        },
                        validTo: {
                            [Op.or]: {
                                [Op.is]: null,
                                [Op.gt]: validFrom,
                            },
                        },
                    },
                },
            );

            const model = this.GridOptimalProfileAssignment.build({
                gridId: gridId,
                optimalProfileId: newMatrixId,
                validFrom,
                validTo: validTo !== null ? Math.floor(validTo) : null,
                stopThreshold: stopThreshold ?? null,
                optimalDryBound: optimalDryBound ?? null,
                optimalWetBound: optimalWetBound ?? null,
                optimalTolerance: optimalTolerance ?? null
            });

            await model.save();

            return {
                matrixId: newMatrixId,
                optimalProfileAssignmentId: model.id,
            };
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async createOptimalProfileCell(
        profileId: number,
        x: number,
        y: number,
        z: number,
        value: number,
        weight: number,
    ): Promise<OptimalProfileModel> {
        const model = this.OptimalProfile.build({
            profileId,
            x,
            y,
            z,
            value,
            weight,
        });

        this.OptimalProfile.removeAttribute('id');

        return await model.save();
    }

    async setOptimalProfileAssignmentEndDate(
        gridId: number,
        timestamp: number,
    ): Promise<number | null> {
        try {
            const [, updatedRecords] =
                await this.GridOptimalProfileAssignment.update(
                    {
                        validTo: timestamp,
                    },
                    {
                        where: {
                            gridId,
                            validFrom: {
                                [Op.lt]: timestamp,
                            },
                            validTo: {
                                [Op.is]: null,
                            },
                        },
                        returning: true,
                    },
                );

            return updatedRecords.length > 0
                ? updatedRecords[0].id
                : null;
        } catch (error) {
            throw new Error(
                `Error setting validity end of the optimal profile: ${getErrorMessage(error)}`,
            );
        }
    }

    async deleteGridOptimalProfileAssignments(
        gridId: number,
    ): Promise<number[]> {
        try {
            return await _deleteFromModelByParams(
                this.GridOptimalProfileAssignment,
                { gridId },
            );
        } catch (error) {
            throw new Error(
                `Error deleting grid optimal profile assignments: ${getErrorMessage(error)}`,
            );
        }
    }
}

export default OptimalStateRepository;
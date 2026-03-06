import { Op, Sequelize, QueryTypes } from 'sequelize';
import { HUMIDITY_DEVICE_TYPE } from '../../commons/constants.js';

class ThesisRepository {

    constructor(models, sequelize) {
        this.Company = models.Company
        this.Farm = models.Farm
        this.Sector = models.Sector
        this.Thesis = models.Thesis
        this.ThesisInSector = models.ThesisInSector
        this.GridOptimalProfileAssignment = models.GridOptimalProfileAssignment
        this.OptimalProfile = models.OptimalProfile
        this.sequelize = sequelize
    }

    async thesisExists(thesisId) {
        const count = await this.Thesis.count({
            where: { id: thesisId }
        });
        return count > 0;
    }

    async createThesis(thesisName) {
        try {
            const thesis = await this.Thesis.create({ thesisName: thesisName });
            return thesis.id;
        } catch (error) {
            throw new Error(`Error creating thesis: ${error.message}`);
        }
    }

    async assignThesisToSector(thesisId, sectorId, weight, validFrom, validTo) {
        const model = await this.ThesisInSector.create({
            thesisId,
            sectorId,
            weight,
            validFrom,
            validTo
        });
        return model.id;
    }

    async disableThesisInSector(sectorId, thesisId, timestamp) {
        const [updatedCount, updatedRecords] = await this.ThesisInSector.update(
            {
                validTo: timestamp
            },
            {
                where: {
                    sectorId: sectorId,
                    thesisId: thesisId,
                    validFrom: {
                        [Op.lt]: timestamp
                    },
                    validTo: {
                        [Op.or]: {
                            [Op.is]: null,
                            [Op.gt]: timestamp
                        },
                    }
                },
                returning: true
            }
        );

        if (updatedRecords && updatedRecords.length > 0) {
            return updatedRecords[0].id;
        }

        return null;
    }

    async getThesisDetails(thesisId, timestamp) {
        const timeFilter = {
        }
        if (timestamp) {
            timeFilter["validFrom"] = {
                [Op.lt]: timestamp
            }
            timeFilter[validTo] = {
                [Op.or]: {
                    [Op.is]: null,
                    [Op.gt]: timestamp
                },
            }
        }
        const result = await this.ThesisInSector.findOne({
            where: {
                thesisId: thesisId,
                ...timeFilter
            },
            include: [{
                model: this.Thesis,
                as: "thesis",
                attributes: []
            }, {
                model: this.Sector,
                as: "sector",
                include: [
                    {
                        model: this.Farm,
                        as: 'farm',
                        attributes: ['id', 'farmName', 'location'],
                        include: [
                            {
                                model: this.Company,
                                as: 'company',
                                attributes: ['id', 'companyName']
                            }
                        ]
                    },
                ]
            }],
            attributes: {
                include: [
                    [Sequelize.col("thesis.thesis_name"), "thesisName"]
                ]
            },
            raw: true,
            nest: true
        })
        return result
    }

    async getOptimalState(thesisId, timestamp) {
        const query = `
            WITH validity_table AS (
                SELECT device_id, device_binning_id, thesis_id, thesis_name
                    FROM theses_all_signals
                WHERE device_type = :HUMIDITY_DEVICE_TYPE
                    AND thesis_id = :thesisId
                GROUP BY device_id, thesis_id, thesis_name, device_binning_id
                HAVING MIN(valid_from) < :timestamp
                    AND MAX(COALESCE(valid_to, 'infinity')) > :timestamp
                LIMIT 1
            )

            SELECT
                v.thesis_name AS "thesisName",
                v.device_binning_id as "binningId",
                gop.grid_id AS "gridId",
                gop.valid_from AS "validFrom",
                gop.valid_to AS "validTo",
                gop.stop_percentage AS "stopPercentage",
                gop.optimal_dry_bound AS "optimalDryBound",
                gop.optimal_wet_bound AS "optimalWetBound",
                op.x,
                op.y,
                op.z,
                op.weight,
                op.value
                FROM validity_table v
                JOIN grid_optimal_profile_assignment gop
                    ON v.device_id = gop.grid_id
                JOIN optimal_profiles op
                    ON op.profile_id = gop.optimal_profile_id
                WHERE gop.valid_from < :timestamp
                    AND (gop.valid_to IS NULL OR gop.valid_to > :timestamp)
        `;

        const results = await this.sequelize.query(query, {
            replacements: {
                thesisId,
                timestamp,
                HUMIDITY_DEVICE_TYPE
            },
            type: QueryTypes.SELECT
        });

        return (results);
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

    async createMatrixProfile(profileId, x, y, z, value, weight) {
        const model = this.OptimalProfile.build({ profileId: profileId, x: x, y: y, z: z, value: value, weight: weight })
        this.OptimalProfile.removeAttribute('id')
        return await model.save()
    }

    async disableThesisFromSectors(thesisId, timestamp) {
        try {
            const [updatedCount, updatedRecords] = await this.ThesisInSector.update(
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
            )

            if (updatedRecords && updatedRecords.length > 0) {
                return updatedRecords.map(record => record.id);
            }
            return null;
        } catch (error) {
            throw new Error(`Error disabling thesis from sector: ${error.message}`);
        }
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

export default ThesisRepository
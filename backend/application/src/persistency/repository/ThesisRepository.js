import { Op, Sequelize, QueryTypes, where } from 'sequelize';
import { HUMIDITY_DEVICE_TYPE } from '../../commons/constants.js';
import { _deleteFromModelByParams } from '../../commons/repositoryUtils.js';

class ThesisRepository {

    constructor(models, sequelize) {
        this.Company = models.Company
        this.Farm = models.Farm
        this.Sector = models.Sector
        this.Thesis = models.Thesis
        this.ThesisInSector = models.ThesisInSector
        this.sequelize = sequelize
    }

    async thesisExists(thesisId) {
        const count = await this.Thesis.count({
            where: { id: thesisId }
        });
        return count > 0;
    }

    async createThesis(thesisData) {
        try {
            const thesis = await this.Thesis.create({ thesisName: thesisData.name, createdAt: thesisData.validFrom });
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

    async getThesisDetails(thesisId, timeFilterFrom, timeFilterTo) {
        const result = await this.ThesisInSector.findOne({
            where: {
                thesisId: thesisId,
                validFrom: {
                    [Op.lt]: timeFilterTo
                },
                validTo: {
                    [Op.or]: {
                        [Op.is]: null,
                        [Op.gt]: timeFilterFrom
                    }
                }   
            },
            include: [{
                model: this.Thesis,
                as: "thesis",
                attributes: ['thesisName', 'createdAt', 'disabledAt'],
                where: {
                    createdAt: {
                        [Op.lt]: timeFilterTo
                    },
                    disabledAt: {
                        [Op.or]: {
                            [Op.is]: null,
                            [Op.gt]: timeFilterFrom
                        }
                    }
                } 
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
                gop.optimal_profile_id AS "optimalProfileId",
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

    async deleteThesisFromSectors(thesisId) {
        try {
            return await _deleteFromModelByParams(this.ThesisInSector, { thesisId: thesisId })
        } catch (error) {
            throw new Error(`Error deleting thesis from sector: ${error.message}`);
        }
    }

    async updateThesis(thesisId, updates) {
        try {
            const thesis = await this.Thesis.findByPk(thesisId);
            if (!thesis) throw new Error("Thesis not found");
            const { name } = updates
            return await thesis.update({ thesisName: name });
        } catch (error) {
            throw new Error(`Error while updating thesis caused by: ${error.message}`);
        }
    }

    async disableThesis(thesisId, timestamp) {
        try {
            await this.Thesis.update(
                {
                    disabledAt: timestamp
                },
                {
                    where: {
                        id: thesisId,
                        disabledAt: {
                            [Op.is]: null
                        }
                    }
                }
            )
        } catch (error) {
            throw new Error(`Error disabling thesis: ${error.message}`);
        }
    }

    async deleteThesis(thesisId) {
        try {
            return await _deleteFromModelByParams(this.Thesis, { id: thesisId })
        } catch (error) {
            throw new Error(`Error deleting thesis: ${error.message}`);
        }
    }
}

export default ThesisRepository
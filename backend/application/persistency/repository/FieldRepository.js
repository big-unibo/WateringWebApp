import { Op, Sequelize, QueryTypes } from 'sequelize';
import { HUMIDITY_DEVICE_TYPE } from '../../commons/constants.js';

class FieldRepository {

    constructor(models, sequelize) {
        this.Organization = models.Organization
        this.Company = models.Company
        this.Field = models.Field
        this.Sector = models.Sector
        this.Thesis = models.Thesis
        this.ThesisInSector = models.ThesisInSector
        this.Permit = models.Permit
        this.GridOptimalProfileAssignment = models.GridOptimalProfileAssignment
        this.OptimalProfile = models.OptimalProfile
        this.sequelize = sequelize
    }

    async sectorExists(sectorId) {
        const count = await this.Sector.count({
            where: { id: sectorId }
        });
        return count > 0;
    }


    async fieldExists(fieldId) {
        const count = await this.Field.count({
            where: { id: fieldId }
        });
        return count > 0;
    }


    async thesisExists(thesisId) {
        const count = await this.Thesis.count({
            where: { id: thesisId }
        });
        return count > 0;
    }

    async createField(fieldName, companyId, location) {
        try {
            const company = await this.Company.findByPk(companyId);
            if (!company) {
                throw new Error(`Company with ID ${companyId} does not exist.`);
            }

            const fieldCreated = await this.Field.create({
                fieldName,
                companyId,
                location
            });

            return fieldCreated;
        } catch (error) {
            throw new Error(`Error creating new field caused by: ${error.message}`);
        }
    }

    async createSector({
        sectorName,
        fieldId,
        culture,
        cultureType,
        location,
        prescriptive,
        advice,
        dripperCapacity,
        sprinklerCapacity,
        doubleWing
    }) {
        try {
            const field = await this.Field.findByPk(fieldId);
            if (!field) {
                throw new Error(`Field with ID ${fieldId} does not exist.`);
            }
            const sectorCreated = await this.Sector.create({
                sectorName,
                fieldId,
                culture,
                cultureType,
                location,
                prescriptive,
                advice,
                dripperCapacity,
                sprinklerCapacity,
                doubleWing
            });

            return sectorCreated;
        } catch (error) {
            throw new Error(`Error creating new sector caused by: ${error.message}`);
        }
    }

    async getSectorDetails(sectorId, timestamp) {
        const sector = await this.Sector.findByPk(sectorId, {
            attributes: ['id', 'sectorName', 'culture', 'cultureType', 'fieldId', 'location', 'prescriptive', 'advice', 'dripperCapacity', 'sprinklerCapacity', 'doubleWing'],
            include: [
                {
                    model: this.Field,
                    as: 'field',
                    attributes: ['fieldName', 'location', 'companyId'],
                    include: [
                        {
                            model: this.Company,
                            as: 'company',
                            attributes: ['companyName', 'organizationId'],
                            include: [
                                {
                                    model: this.Organization,
                                    as: 'organization',
                                    attributes: ['organizationName'],
                                }
                            ]
                        }
                    ]
                },
                {
                    model: this.ThesisInSector,
                    as: 'thesisInSector',
                    attributes: ['thesisId'],
                    required: timestamp ? true : false,
                    include: [
                        {
                            model: this.Thesis,
                            as: 'thesis',
                            attributes: ['thesisName']
                        }
                    ],
                    where: timestamp ? {
                        validFrom: { [Op.lt]: timestamp },
                        validTo: {
                            [Op.or]: [
                                { [Op.is]: null },
                                { [Op.gt]: timestamp }
                            ]
                        }
                    } : undefined 
                }
            ]
        });

        if (!sector) throw new Error(`Sector with id ${sectorId} not found`);
        return sector.toJSON();
    }

    async getFieldDetails(fieldId) {
        try {
            const field = await this.Field.findByPk(fieldId, {
                attributes: {
                    exclude: ['companyId']
                },
                include: [
                    {
                        model: this.Company,
                        as: 'company',
                        attributes: ['id', 'companyName'],
                        include: [
                            {
                                model: this.Organization,
                                as: 'organization',
                                attributes: ['id', 'organizationName'],
                            }
                        ]
                    },
                    {
                        model: this.Sector,
                        as: 'sectors'
                    }
                ]
            });

            if (!field) {
                throw new Error(`Field with id ${fieldId} not found`);
            }
            return field.get({ plain: true });

        } catch (error) {
            throw new Error(`Error retrieving field details: ${error.message}`);
        }
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
        const result = await this.ThesisInSector.findOne({
            where: {
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
            include: [{
                model: this.Thesis,
                as: "thesis",
                attributes: []
            }, {
                model: this.Sector,
                as: "sector",
                include: [
                    {
                        model: this.Field,
                        as: 'field',
                        attributes: ['id', 'fieldName', 'location'],
                        include: [
                            {
                                model: this.Company,
                                as: 'company',
                                attributes: ['id', 'companyName'],
                                include: [
                                    {
                                        model: this.Organization,
                                        as: 'organization',
                                        attributes: ['id', 'organizationName'],
                                    }
                                ]
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

    async getSectors(userId, timeFilterFrom, timeFilterTo) {

        let timeConditions = "";
        const replacements = { userId };

        if (timeFilterTo) {
            timeConditions += ` AND ts.valid_from <= :timeFilterTo`;
            replacements.timeFilterTo = timeFilterTo;
        }

        if (timeFilterFrom) {
            timeConditions += ` AND (ts.valid_to IS NULL OR ts.valid_to >= :timeFilterFrom)`;
            replacements.timeFilterFrom = timeFilterFrom;
        }

        const query = `
            SELECT DISTINCT
                o.id AS "organizationId",
                o.organization_name AS "organizationName",
                c.id AS "companyId",
                c.company_name AS "companyName",
                f.id AS "fieldId",
                f.field_name AS "fieldName",
                s.id AS "sectorId",
                s.sector_name AS "sectorName",
                s.culture AS "culture",
                s.culture_type AS "cultureType",
                s.location AS "location"
            FROM sectors s
            JOIN fields f
                ON f.id = s.field_id
            JOIN companies c
                ON c.id = f.company_id
            JOIN organizations o
                ON o.id = c.organization_id
            JOIN users u
                ON u.id = :userId 
            LEFT JOIN permits p
                ON p.id_key = s.id 
                AND p.table = 'sectors'
            LEFT JOIN theses_in_sectors ts
                ON ts.sector_id = s.id
            WHERE 
                (
                    (u.role = 'admin') 
                    OR 
                    (p.user_id = :userId) 
                )
                ${timeConditions}
            ORDER BY 
                "organizationName", "companyName", "fieldName", "sectorName";
        `;

        const results = await this.sequelize.query(query, {
            replacements: replacements,
            type: this.sequelize.QueryTypes.SELECT
        });

        return results;
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

export default FieldRepository
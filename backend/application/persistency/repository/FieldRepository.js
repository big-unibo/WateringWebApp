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

    // constructor(Field, Company,  MatrixProfile, MatrixField, TranscodingField, WateringThesis, WateringSector, WateringAlgorithmParams, sequelize) {
    //     this.Field = Field
    //     this.Company = Company
    //     this.MatrixProfile = MatrixProfile
    //     this.MatrixField = MatrixField
    //     this.TranscodingField = TranscodingField
    //     this.WateringThesis = WateringThesis
    //     this.WateringSector = WateringSector
    //     this.WateringAlgorithmParams = WateringAlgorithmParams
    //     this.sequelize = sequelize

    //     MatrixField.hasMany(MatrixProfile, { foreignKey: 'matrixId' });
    //     MatrixProfile.belongsTo(MatrixField, { foreignKey: 'matrixId' });
    //     Field.belongsTo(Company, {foreignKey: 'company_id'});
    // }

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
        cultureType = null,
        location = null,
        prescriptive = null,
        advice = null,
        dripperCapacity = null,
        sprinklerCapacity = null,
        doubleWing = null
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
                    atributes: ['thesisId'],
                    as: 'thesisInSector',
                    include: [
                        {
                            model: this.Thesis,
                            as: 'thesis',
                            attributes: ['thesisName']
                        }
                    ],
                    where: {
                        validFrom: {
                            [Op.lt]: timestamp
                        },
                        validTo: {
                            [Op.or]: {
                                [Op.is]: null,
                                [Op.gt]: timestamp
                            },
                        }
                    }
                }
            ]
        });

        if (!sector) throw new Error(`Sector with id ${sectorId} not found`);
        return sector.toJSON();
    }

    async getFieldDetails(fieldId) {
        const field = await this.Field.findByPk(fieldId, {
            include: [
                {
                    model: this.Company,
                    as: 'company'
                }
            ]
        });

        if (!field) throw new Error(`Field with id ${fieldId} not found`);
        return field;
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
        return await this.ThesisInSector.create({
            thesisId,
            sectorId,
            weight,
            validFrom,
            validTo
        });
    }

    async disableThesisInSector(sectorId, thesisId, timestamp) {
        return await this.ThesisInSector.update(
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
                }
            })
    }

    async getThesisDetails(thesisId, timestamp) {
        return await this.ThesisInSector.findOne({
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
            }],
            attributes: {
                include: [
                    [Sequelize.col("thesis.thesis_name"), "thesisName"]
                ]
            },
            raw: true
        })
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
            JOIN theses_in_sectors ts
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


        // ts.valid_from <= :timeFilterTo
        //         AND (ts.valid_to IS NULL OR ts.valid_to >= :timeFilterFrom)           
        //         AND 

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

    async createMatrixOptimalState(gridId, validFrom, validTo, stopPercentage, optimalDryBound, optimalWetBound, profileId = null) {
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

            const model = await this.GridOptimalProfileAssignment.build({
                gridId: gridId,
                optimalProfileId: newMatrixId,
                validFrom: validFrom,
                validTo: validTo ? Math.floor(validTo) : null,
                stopPercentage: stopPercentage ?? null,
                optimalDryBound: optimalDryBound ?? null,
                optimalWetBound: optimalWetBound ?? null
            })

            await model.save()
            return newMatrixId
        } catch (error) {
            throw Error(error.message)
        }
    }

    async createMatrixProfile(profileId, x, y, z, value, weight) {
        const model = this.OptimalProfile.build({ profileId: profileId, x: x, y: y, z: z, value: value, weight: weight })
        this.OptimalProfile.removeAttribute('id')
        return await model.save()
    }

    async disableThesisFromSector(thesisId, timestamp) {
        try {
            await this.ThesisInSector.update(
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
                    }
                }
            )
        } catch (error) {
            throw new Error(`Error disabling thesis from sector: ${error.message}`);
        }
    }

    async setOptimalProfileAssignmentEndDate(gridId, timestamp) {
        try {
            await this.GridOptimalProfileAssignment.update(
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
                    }
                }
            )
        } catch (error) {
            throw new Error(`Error setting validty end of the optimal profie: ${error.message}`);
        }
    }
    // async updateWateringSectorDetails(sectorDetails, timestampFrom){
    //     this.WateringSector.removeAttribute('id')
    //     this.WateringSector.update(
    //         { 
    //             timestamp_to: timestampFrom,
    //         },
    //         {
    //             where: {
    //                 refStructureName: sectorDetails.refStructureName,
    //                 companyName: sectorDetails.companyName,
    //                 fieldName: sectorDetails.fieldName,
    //                 sectorName: sectorDetails.sectorName,
    //                 timestamp_from: { [Op.lt]: timestampFrom },
    //                 timestamp_to: {
    //                     [Op.or]: {
    //                         [Op.is]: null,
    //                         [Op.gt]: timestampFrom
    //                     },
    //                 }
    //             }
    //         }
    //     )

    //     this.WateringSector.build({
    //         source: sectorDetails.source,
    //         refStructureName: sectorDetails.refStructureName,
    //         companyName: sectorDetails.companyName,
    //         fieldName: sectorDetails.fieldName,
    //         sectorName: sectorDetails.sectorName,
    //         advice: sectorDetails.advice,
    //         prescriptive: sectorDetails.prescriptive,
    //         dripper_capacity: sectorDetails.dripperCapacity,
    //         dripper_scaling_factor: sectorDetails.dripperScalingFactor,
    //         sprinkler_capacity: sectorDetails.sprinklerCapacity,
    //         valve_id: sectorDetails.valveId,
    //         timestamp_from: timestampFrom,
    //         timestamp_to: null
    //     }).save()      
    // }

    // async disableWateringBaseline(refStructureName, companyName, fieldName, sectorName, timestamp){
    //     await this.WateringAlgorithmParams.update(
    //         {
    //             timestamp_to: timestamp
    //         },
    //         {
    //             where:{
    //                 refStructureName: refStructureName,
    //                 companyName: companyName,
    //                 fieldName: fieldName,
    //                 sectorName: sectorName,
    //                 timestamp_from: {
    //                     [Op.lt]: timestamp
    //                 },
    //                 timestamp_to: {
    //                     [Op.is]: null
    //                 },
    //             }
    //         }
    //     )
    // }

    // async disableMonitoringThesis(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp){
    //     await this.WateringThesis.update(
    //         {
    //             timestamp_to: timestamp
    //         },
    //         {
    //             where:{
    //                 refStructureName: refStructureName,
    //                 companyName: companyName,
    //                 fieldName: fieldName,
    //                 sectorName: sectorName,
    //                 thesisName: thesisName,
    //                 timestamp_from: {
    //                     [Op.lt]: timestamp
    //                 },
    //                 timestamp_to: {
    //                     [Op.is]: null
    //                 },
    //             }
    //         }
    //     )
    // }

    // async disableSector(refStructureName, companyName, fieldName, sectorName, timestamp){
    //     // Disable all monitoring thesis of a sector
    //     await this.WateringThesis.update(
    //         {
    //             timestamp_to: timestamp
    //         },
    //         {
    //             where:{
    //                 refStructureName: refStructureName,
    //                 companyName: companyName,
    //                 fieldName: fieldName,
    //                 sectorName: sectorName,
    //                 timestamp_from: {
    //                     [Op.lt]: timestamp
    //                 },
    //                 timestamp_to: {
    //                     [Op.is]: null
    //                 },
    //             }
    //         }
    //     )
    //     await this.WateringSector.update(
    //         {
    //             timestamp_to: timestamp
    //         },
    //         {
    //             where:{
    //                 refStructureName: refStructureName,
    //                 companyName: companyName,
    //                 fieldName: fieldName,
    //                 sectorName: sectorName,
    //                 timestamp_from: {
    //                     [Op.lt]: timestamp
    //                 },
    //                 timestamp_to: {
    //                     [Op.is]: null
    //                 },
    //             }
    //         }
    //     )
    // }

    // async disableOptimalState(refStructureName, companyName, fieldName, sectorName, timestamp){
    //     // Disable optimal for all thesis of a sector
    //     await this.MatrixField.update(
    //         {
    //             timestamp_to: timestamp,
    //             current: false
    //         },
    //         {
    //             where:{
    //                 refStructureName: refStructureName,
    //                 companyName: companyName,
    //                 fieldName: fieldName,
    //                 sectorName: sectorName,
    //                 current: true
    //             }
    //         }
    //     )

    // }

    // async disableNode(refStructureName, companyName, fieldName, sectorName, thesisName, nodeId, timestamp){
    //     await this.TranscodingField.update(
    //         {
    //             valid_to: timestamp
    //         },
    //         {
    //             where:{
    //                 refStructureName: refStructureName,
    //                 companyName: companyName,
    //                 fieldName: fieldName,
    //                 sectorName: sectorName,
    //                 thesisName: thesisName,
    //                 nodeId: nodeId,
    //                 valid_from: {
    //                     [Op.lt]: timestamp
    //                 },
    //                 valid_to: {
    //                     [Op.is]: null
    //                 },
    //             }
    //         }
    //     )
    // }
}

export default FieldRepository
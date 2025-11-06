import { Op, Sequelize } from 'sequelize';

class FieldRepository {

    constructor(models, sequelize) {
        this.Organization = models.Organization
        this.Company = models.Company
        this.Field = models.Field
        this.Sector = models.Sector
        this.Thesis = models.Thesis
        this.ThesisInSector = models.ThesisInSector
        this.Permit = models.Permit
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

    async getSectorDetails(sectorId) {
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
                    ]
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
            const thesis = await this.Thesis.create({ thesisName });
            return thesis.id;
        } catch (error) {
            throw new Error(`Error creating thesis: ${error.message}`);
        }
    }

    async assignThesisToSector(thesisId, sectorId, weight, validFrom) {
        return await this.ThesisInSector.create({
            thesisId,
            sectorId,
            weight,
            validFrom,
        });
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
                ts.valid_from <= :timeFilterTo
                AND (ts.valid_to IS NULL OR ts.valid_to >= :timeFilterFrom)           
                AND (
                    (u.role = 'admin') 
                    OR 
                    (p.user_id = :userId) 
                )
            ORDER BY 
                "organizationName", "companyName", "fieldName", "sectorName";
        `;

        const results = await this.sequelize.query(query, {
            replacements: { userId, timeFilterFrom, timeFilterTo },
            type: this.sequelize.QueryTypes.SELECT
        });

        return results;
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

    // async getWateringSectorDetails(refStructureName, companyName, fieldName, sectorName, timestamp) {
    //     this.WateringSector.removeAttribute('id')
    //     return await this.WateringSector.findOne({
    //         where: {
    //             refStructureName: refStructureName,
    //             companyName: companyName,
    //             fieldName: fieldName,
    //             sectorName: sectorName,
    //             timestamp_from: { [Op.lt]: timestamp },
    //             timestamp_to: {
    //                 [Op.or]: {
    //                     [Op.is]: null,
    //                     [Op.gt]: timestamp
    //                 },
    //             }
    //         }
    //     })
    // }

    // async createMatrixProfile(matrixId, x, y, z, value) {
    //     const model = this.MatrixProfile.build({matrixId: matrixId, xx: x, yy: y, zz: z, optValue: value, weight: 1})
    //     this.MatrixProfile.removeAttribute('id')
    //     return await model.save()
    // }

    // async createMatrixField(source, refStructureName, companyName, fieldName, sectorName, thesisName, validFrom, validTo, matrixId) {
    //     try {
    //         let newMatrixId
    //         if(matrixId){
    //             this.MatrixProfile.removeAttribute('id')
    //             const result = await this.MatrixProfile.findAll({
    //                 where: {
    //                     matrixId: matrixId
    //                 }
    //             })
    //             if(result.length > 0){
    //                 newMatrixId = matrixId    
    //             } else {
    //                 throw Error("Matrix profile not found")
    //             }
    //         } else {
    //             newMatrixId = await this.MatrixProfile.max('matrixId') + 1
    //         }
    //         this.MatrixField.update(
    //             { 
    //                 timestamp_to: Math.floor(validFrom),
    //                 current: false 
    //             },
    //             {
    //                 where: {
    //                     source: source,
    //                     refStructureName: refStructureName,
    //                     companyName: companyName,
    //                     fieldName: fieldName,
    //                     sectorName: sectorName,
    //                     thesisName: thesisName,
    //                     current: true
    //                 }
    //             }
    //         )

    //         const model = this.MatrixField.build({
    //                 source: source,
    //                 refStructureName: refStructureName,
    //                 companyName: companyName,
    //                 fieldName: fieldName,
    //                 sectorName: sectorName,
    //                 thesisName: thesisName,
    //                 timestamp_from: Math.floor(validFrom),
    //                 timestamp_to: validTo ? Math.floor(validTo) : null,
    //                 current: true,
    //                 matrixId: newMatrixId
    //             })

    //         await model.save()
    //         return newMatrixId
    //     } catch (error) {
    //         throw Error(error.message)
    //     }
    // }

    // async getOptimalState(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp){
    //     try {
    //         const query = `SELECT 
    //                 "matrix_profile"."xx", 
    //                 "matrix_profile"."yy", 
    //                 "matrix_profile"."zz", 
    //                 "matrix_profile"."optValue", 
    //                 "matrix_profile"."weight",
    //                 "matrix_profile"."matrixId", 
    //                 "field_matrix"."source",
    //                 "field_matrix"."refStructureName", 
    //                 "field_matrix"."companyName", 
    //                 "field_matrix"."fieldName", 
    //                 "field_matrix"."sectorName", 
    //                 "field_matrix"."thesisName", 
    //                 "field_matrix"."timestamp_from" AS "validFrom", 
    //                 "field_matrix"."timestamp_to" AS "validTo" 
    //             FROM "matrix_profile" 
    //             INNER JOIN "field_matrix" 
    //                 ON "matrix_profile"."matrixId" = "field_matrix"."matrixId"
    //             INNER JOIN (
    //                 SELECT 
    //                     xx, 
    //                     yy, 
    //                     zz,
    //                     MAX("timestamp") as max_timestamp
    //                 FROM data_interpolated
    //                 WHERE "timestamp" < ${timestamp}
    //                 AND "source" = 'iFarming'
    //                 AND "refStructureName" = '${refStructureName}'
    //                 AND "companyName" = '${companyName}'
    //                 AND "fieldName" = '${fieldName}'
    //                 AND "sectorName" = '${sectorName}'
    //                 AND "thesisName" = '${thesisName}'
    //                 GROUP BY xx, yy, zz
    //             ) AS actual_profile
    //                 ON "matrix_profile".xx = actual_profile.xx
    //                 AND "matrix_profile".yy = actual_profile.yy
    //                 AND "matrix_profile".zz = actual_profile.zz
    //             WHERE "field_matrix"."refStructureName" = '${refStructureName}' 
    //                 AND "field_matrix"."companyName" = '${companyName}' 
    //                 AND "field_matrix"."fieldName" = '${fieldName}' 
    //                 AND "field_matrix"."sectorName" = '${sectorName}' 
    //                 AND "field_matrix"."thesisName" = '${thesisName}' 
    //                 AND "field_matrix"."timestamp_from" < ${timestamp} 
    //                 AND ("field_matrix"."timestamp_to" IS NULL OR "field_matrix"."timestamp_to" > ${timestamp});`

    //         const result = await this.sequelize.query(query, {
    //             type: QueryTypes.SELECT,
    //             bind: {
    //             refStructureName,
    //             companyName,
    //             fieldName,
    //             sectorName,
    //             thesisName,
    //             timestamp
    //             }
    //         });

    //         return result

    //     } catch (error) {
    //         console.error('Error on get optimal state:', error);
    //     }
    // }

    // async getFieldDetails(refStructureName, companyName, fieldName, sectorName, thesisName) {
    //     try {
    //         this.TranscodingField.removeAttribute('id')
    //         return await this.TranscodingField.findOne({
    //             where: {
    //             refStructureName: refStructureName,
    //             companyName: companyName,
    //             fieldName: fieldName,
    //             sectorName: sectorName,
    //             thesisName: thesisName,
    //             }
    //         });
    //     } catch (error) {
    //         console.error('Error on find field details:', error);
    //     }
    // }

    // async getDripperInfo(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp) {
    //     try {
    //         this.WateringThesis.removeAttribute('id')
    //         const result = await this.WateringThesis.findOne({
    //             where: {
    //                 refStructureName: refStructureName,
    //                 companyName: companyName,
    //                 fieldName: fieldName,
    //                 sectorName: sectorName,
    //                 thesisName: thesisName,
    //                 timestamp_from: { [Op.lt]: timestamp },
    //                 timestamp_to: {
    //                     [Op.or]: {
    //                     [Op.is]: null,
    //                     [Op.gt]: timestamp
    //                     },
    //                 }
    //             }
    //         });
    //         const dripper = {
    //             xx: result ? result.dataValues.dripper_pos : 0,
    //             yy: 0
    //         }
    //         return dripper
    //     } catch (error) {
    //         console.error('Error on find field details:', error);
    //     }
    // }

    // async setWateringBaseline(baseline, timestampFrom){
    //     this.WateringAlgorithmParams.removeAttribute('id')

    //     const oldParams = await this.getWateringAlgorithmParams(baseline.refStructureName, baseline.companyName, baseline.fieldName, baseline.sectorName, timestampFrom)

    //     this.WateringAlgorithmParams.update(
    //         { 
    //             timestamp_to: timestampFrom,
    //         },
    //         {
    //             where: {
    //                 refStructureName: baseline.refStructureName,
    //                 companyName: baseline.companyName,
    //                 fieldName: baseline.fieldName,
    //                 sectorName: baseline.sectorName,
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

    //     const model = this.WateringAlgorithmParams.build({
    //         source: oldParams ? oldParams.dataValues.source :'iFarming',
    //         refStructureName: baseline.refStructureName,
    //         companyName: baseline.companyName,
    //         fieldName: baseline.fieldName,
    //         sectorName: baseline.sectorName,
    //         timestamp_from: timestampFrom,
    //         max_irrigation: baseline.maxIrrigation ? baseline.maxIrrigation : oldParams.dataValues.max_irrigation,
    //         irrigation_baseline: baseline.irrigationBaseline ? baseline.irrigationBaseline : oldParams.dataValues.irrigation_baseline,
    //         watering_hour: baseline.wateringHour ? baseline.wateringHour : oldParams.dataValues.watering_hour,
    //         irrigation_frequency: baseline.irrigationFrequency ? baseline.irrigationFrequency : oldParams.dataValues.irrigation_frequency,
    //         ki: baseline.ki ? baseline.ki : oldParams.dataValues.ki,
    //         kp: baseline.kp ? baseline.kp : oldParams.dataValues.kp
    //     });
    //     return model.save()
    // }

    // async setPrescriptiveThesis(refStructureName, companyName, fieldName, sectorName, prescriptiveThesis, timestampFrom){
    //     this.WateringThesis.removeAttribute('id')

    //     const oldTheses = await this.WateringThesis.findAll({
    //         where: {
    //             refStructureName: refStructureName,
    //             companyName: companyName,
    //             fieldName: fieldName,
    //             sectorName: sectorName,
    //             timestamp_from: { [Op.lt]: timestampFrom },
    //             timestamp_to: {
    //                 [Op.or]: {
    //                     [Op.is]: null,
    //                     [Op.gt]: timestampFrom
    //                 },
    //             }
    //         }
    //     })

    //     this.WateringThesis.update(
    //         { 
    //             timestamp_to: timestampFrom,
    //         },
    //         {
    //             where: {
    //                 refStructureName: refStructureName,
    //                 companyName: companyName,
    //                 fieldName: fieldName,
    //                 sectorName: sectorName,
    //                 timestamp_from: { [Op.lt]: timestampFrom },
    //                 timestamp_to: {
    //                     [Op.or]: {
    //                     [Op.is]: null,
    //                     [Op.gt]: timestampFrom
    //                     },
    //                 }
    //             }
    //         }
    //     )

    //     for(const thesis of oldTheses){
    //         thesis.weight = thesis.thesisName == prescriptiveThesis ? 1 : 0
    //         thesis.dripperPosition = thesis.dripper_pos
    //         await this.createThesis(thesis, timestampFrom)
    //     }
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
import { QueryTypes, Op } from 'sequelize'

class FieldRepository {

    constructor(MatrixProfile, MatrixField, TranscodingField, WateringThesis, WateringSector, WateringAlgorithmParams, sequelize) {
        this.MatrixProfile = MatrixProfile
        this.MatrixField = MatrixField
        this.TranscodingField = TranscodingField
        this.WateringThesis = WateringThesis
        this.WateringSector = WateringSector
        this.WateringAlgorithmParams = WateringAlgorithmParams
        this.sequelize = sequelize

        MatrixField.hasMany(MatrixProfile, { foreignKey: 'matrixId' });
        MatrixProfile.belongsTo(MatrixField, { foreignKey: 'matrixId' });
    }

    async createThesis(thesis, timestampFrom){
        this.WateringThesis.removeAttribute('id')
        const model = this.WateringThesis.build({
            source: thesis.source,
            refStructureName: thesis.refStructureName,
            companyName: thesis.companyName,
            fieldName: thesis.fieldName,
            sectorName: thesis.sectorName,
            plantRow: thesis.plantRow,
            dripper_pos: thesis.dripperPosition,
            weight: thesis.weight,
            timestamp_from: timestampFrom,
            timestamp_to: null
        })
        return await model.save()
    }

    async updateWateringSectorDetails(sectorDetails, timestampFrom){
        this.WateringSector.removeAttribute('id')
        this.WateringSector.update(
            { 
                timestamp_to: timestampFrom,
            },
            {
                where: {
                    refStructureName: sectorDetails.refStructureName,
                    companyName: sectorDetails.companyName,
                    fieldName: sectorDetails.fieldName,
                    sectorName: sectorDetails.sectorName,
                    timestamp_from: { [Op.lt]: timestampFrom },
                    timestamp_to: {
                        [Op.or]: {
                            [Op.is]: null,
                            [Op.gt]: timestampFrom
                        },
                    }
                }
            }
        )

        this.WateringSector.build({
            source: sectorDetails.source,
            refStructureName: sectorDetails.refStructureName,
            companyName: sectorDetails.companyName,
            fieldName: sectorDetails.fieldName,
            sectorName: sectorDetails.sectorName,
            advice: sectorDetails.advice,
            prescriptive: sectorDetails.prescriptive,
            dripper_capacity: sectorDetails.dripperCapacity,
            dripper_scaling_factor: sectorDetails.dripperScalingFactor,
            sprinkler_capacity: sectorDetails.sprinklerCapacity,
            valve_id: sectorDetails.valveId,
            timestamp_from: timestampFrom,
            timestamp_to: null
        }).save()      
    }

    async getWateringSectorDetails(refStructureName, companyName, fieldName, sectorName, timestamp) {
        this.WateringSector.removeAttribute('id')
        return await this.WateringSector.findOne({
            where: {
                refStructureName: refStructureName,
                companyName: companyName,
                fieldName: fieldName,
                sectorName: sectorName,
                timestamp_from: { [Op.lt]: timestamp },
                timestamp_to: {
                    [Op.or]: {
                        [Op.is]: null,
                        [Op.gt]: timestamp
                    },
                }
            }
        })
    }

    async createMatrixProfile(matrixId, x, y, z, value) {
        const model = this.MatrixProfile.build({matrixId: matrixId, xx: x, yy: y, zz: z, optValue: value, weight: 1})
        this.MatrixProfile.removeAttribute('id')
        return await model.save()
    }

    async createMatrixField(refStructureName, companyName, fieldName, sectorName, validFrom, validTo, matrixId) {
        try {
            this.MatrixField.update(
                { 
                    timestamp_to: Math.floor(validFrom),
                    current: false 
                },
                {
                    where: {
                        refStructureName: refStructureName,
                        companyName: companyName,
                        fieldName: fieldName,
                        sectorName: sectorName,
                        current: true
                    }
                }
            )

            this.WateringThesis.removeAttribute('id')
            const sectorThesis = await this.WateringThesis.findAll({
                where: {
                    refStructureName: refStructureName,
                    companyName: companyName,
                    fieldName: fieldName,
                    sectorName: sectorName,
                    timestamp_from: { [Op.lt]: validTo || validFrom },
                    timestamp_to: {
                        [Op.or]: {
                        [Op.is]: null,
                        [Op.gt]: validFrom
                        },
                    }
                }
            })

            if( sectorThesis.length > 0){
                const newMatrixId = !matrixId ? await this.MatrixProfile.max('matrixId') + 1 : matrixId
            
                for( const thesis of sectorThesis){
                    const model = this.MatrixField.build({
                        source: thesis.source,
                        refStructureName: thesis.refStructureName,
                        companyName: thesis.companyName,
                        fieldName: thesis.fieldName,
                        sectorName: thesis.sectorName,
                        plantRow: thesis.plantRow,
                        timestamp_from: Math.floor(validFrom),
                        timestamp_to: validTo ? Math.floor(validTo) : null,
                        current: true,
                        matrixId: newMatrixId
                    })
                    await model.save()
                }
                return newMatrixId
            } 
        } catch (error) {
            throw Error(error.message)
        }
    }

    async getOptimalState(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp){
        try {
            const query = `SELECT 
                    "matrix_profile"."xx", 
                    "matrix_profile"."yy", 
                    "matrix_profile"."zz", 
                    "matrix_profile"."optValue", 
                    "matrix_profile"."weight", 
                    "field_matrix"."source",
                    "field_matrix"."refStructureName", 
                    "field_matrix"."companyName", 
                    "field_matrix"."fieldName", 
                    "field_matrix"."sectorName", 
                    "field_matrix"."plantRow", 
                    "field_matrix"."timestamp_from" AS "validFrom", 
                    "field_matrix"."timestamp_to" AS "validTo" 
                FROM "matrix_profile" 
                INNER JOIN "field_matrix" 
                    ON "matrix_profile"."matrixId" = "field_matrix"."matrixId"
                INNER JOIN (
                    SELECT 
                        xx, 
                        yy, 
                        zz,
                        MAX("timestamp") as max_timestamp
                    FROM data_interpolated
                    WHERE "timestamp" < ${timestamp}
                    AND "source" = 'iFarming'
                    AND "refStructureName" = '${refStructureName}'
                    AND "companyName" = '${companyName}'
                    AND "fieldName" = '${fieldName}'
                    AND "sectorName" = '${sectorName}'
                    AND "plantRow" = '${plantRow}'
                    GROUP BY xx, yy, zz
                ) AS actual_profile
                    ON "matrix_profile".xx = actual_profile.xx
                    AND "matrix_profile".yy = actual_profile.yy
                    AND "matrix_profile".zz = actual_profile.zz
                WHERE "field_matrix"."refStructureName" = '${refStructureName}' 
                    AND "field_matrix"."companyName" = '${companyName}' 
                    AND "field_matrix"."fieldName" = '${fieldName}' 
                    AND "field_matrix"."sectorName" = '${sectorName}' 
                    AND "field_matrix"."plantRow" = '${plantRow}' 
                    AND "field_matrix"."timestamp_from" < ${timestamp} 
                    AND ("field_matrix"."timestamp_to" IS NULL OR "field_matrix"."timestamp_to" > ${timestamp});`

            const result = await this.sequelize.query(query, {
                type: QueryTypes.SELECT,
                bind: {
                refStructureName,
                companyName,
                fieldName,
                sectorName,
                plantRow,
                timestamp
                }
            });

            return result
            
        } catch (error) {
            console.error('Error on get optimal state:', error);
        }
    }

    async getFieldDetails(refStructureName, companyName, fieldName, sectorName, plantRow) {
        try {
            this.TranscodingField.removeAttribute('id')
            return await this.TranscodingField.findOne({
                where: {
                refStructureName: refStructureName,
                companyName: companyName,
                fieldName: fieldName,
                sectorName: sectorName,
                plantRow: plantRow,
                }
            });
        } catch (error) {
            console.error('Error on find field details:', error);
        }
    }

    async getDripperInfo(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp) {
        try {
            this.WateringThesis.removeAttribute('id')
            const result = await this.WateringThesis.findOne({
                where: {
                    refStructureName: refStructureName,
                    companyName: companyName,
                    fieldName: fieldName,
                    sectorName: sectorName,
                    plantRow: plantRow,
                    timestamp_from: { [Op.lt]: timestamp },
                    timestamp_to: {
                        [Op.or]: {
                        [Op.is]: null,
                        [Op.gt]: timestamp
                        },
                    }
                }
            });
            const dripper = {
                xx: result ? result.dataValues.dripper_pos : 0,
                yy: 0
            }
            return dripper
        } catch (error) {
            console.error('Error on find field details:', error);
        }
    }

    async setWateringBaseline(baseline, timestampFrom){
        this.WateringAlgorithmParams.removeAttribute('id')

        const oldParams = await this.getWateringAlgorithmParams(baseline.refStructureName, baseline.companyName, baseline.fieldName, baseline.sectorName, timestampFrom)

        this.WateringAlgorithmParams.update(
            { 
                timestamp_to: timestampFrom,
            },
            {
                where: {
                    refStructureName: baseline.refStructureName,
                    companyName: baseline.companyName,
                    fieldName: baseline.fieldName,
                    sectorName: baseline.sectorName,
                    timestamp_from: { [Op.lt]: timestampFrom },
                    timestamp_to: {
                        [Op.or]: {
                            [Op.is]: null,
                            [Op.gt]: timestampFrom
                        },
                    }
                }
            }
        )

        const model = this.WateringAlgorithmParams.build({
            source: oldParams ? oldParams.dataValues.source :'iFarming',
            refStructureName: baseline.refStructureName,
            companyName: baseline.companyName,
            fieldName: baseline.fieldName,
            sectorName: baseline.sectorName,
            timestamp_from: timestampFrom,
            max_irrigation: baseline.maxIrrigation ? baseline.maxIrrigation : oldParams.dataValues.max_irrigation,
            irrigation_baseline: baseline.irrigationBaseline ? baseline.irrigationBaseline : oldParams.dataValues.irrigation_baseline,
            watering_hour: baseline.wateringHour ? baseline.wateringHour : oldParams.dataValues.watering_hour,
            ki: baseline.ki ? baseline.ki : oldParams.dataValues.ki,
            kp: baseline.kp ? baseline.kp : oldParams.dataValues.kp
        });
        return model.save()
    }

    async getWateringAlgorithmParams(refStructureName, companyName, fieldName, sectorName, timestamp) {
        this.WateringAlgorithmParams.removeAttribute('id')
        return await this.WateringAlgorithmParams.findOne({
            where: {
                refStructureName: refStructureName,
                companyName: companyName,
                fieldName: fieldName,
                sectorName: sectorName,
                timestamp_from: { [Op.lt]: timestamp },
                timestamp_to: {
                    [Op.or]: {
                        [Op.is]: null,
                        [Op.gt]: timestamp
                    },
                }
            }
        })
    }

    async setPrescriptiveThesis(refStructureName, companyName, fieldName, sectorName, prescriptiveThesis, timestampFrom){
        this.WateringThesis.removeAttribute('id')

        const oldTheses = await this.WateringThesis.findAll({
            where: {
                refStructureName: refStructureName,
                companyName: companyName,
                fieldName: fieldName,
                sectorName: sectorName,
                timestamp_from: { [Op.lt]: timestampFrom },
                timestamp_to: {
                    [Op.or]: {
                        [Op.is]: null,
                        [Op.gt]: timestampFrom
                    },
                }
            }
        })

        this.WateringThesis.update(
            { 
                timestamp_to: timestampFrom,
            },
            {
                where: {
                    refStructureName: refStructureName,
                    companyName: companyName,
                    fieldName: fieldName,
                    sectorName: sectorName,
                    timestamp_from: { [Op.lt]: timestampFrom },
                    timestamp_to: {
                        [Op.or]: {
                        [Op.is]: null,
                        [Op.gt]: timestampFrom
                        },
                    }
                }
            }
        )

        for(const thesis of oldTheses){
            thesis.weight = thesis.plantRow == prescriptiveThesis ? 1 : 0
            thesis.dripperPosition = thesis.dripper_pos
            await this.createThesis(thesis, timestampFrom)
        }
    }

    async disableWateringBaseline(refStructureName, companyName, fieldName, sectorName, timestamp){
        await this.WateringAlgorithmParams.update(
            {
                timestamp_to: timestamp
            },
            {
                where:{
                    refStructureName: refStructureName,
                    companyName: companyName,
                    fieldName: fieldName,
                    sectorName: sectorName,
                    timestamp_from: {
                        [Op.lt]: timestamp
                    },
                    timestamp_to: {
                        [Op.is]: null
                    },
                }
            }
        )
    }

    async disableWateringSectorThesis(refStructureName, companyName, fieldName, sectorName, timestamp){
        // Disable all thesis of a sector
        await this.WateringThesis.update(
            {
                timestamp_to: timestamp
            },
            {
                where:{
                    refStructureName: refStructureName,
                    companyName: companyName,
                    fieldName: fieldName,
                    sectorName: sectorName,
                    timestamp_from: {
                        [Op.lt]: timestamp
                    },
                    timestamp_to: {
                        [Op.is]: null
                    },
                }
            }
        )

    }

    async disableOptimalState(refStructureName, companyName, fieldName, sectorName, timestamp){
        // Disable all thesis of a sector
        await this.MatrixField.update(
            {
                timestamp_to: timestamp,
                current: false
            },
            {
                where:{
                    refStructureName: refStructureName,
                    companyName: companyName,
                    fieldName: fieldName,
                    sectorName: sectorName,
                    current: true
                }
            }
        )

    }

}

export default FieldRepository
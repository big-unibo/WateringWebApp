import { QueryTypes, Op } from 'sequelize'
import { WateringAdviceDto } from '../../dtos/wateringAdviceDto.js'

class FieldRepository {

  constructor(MatrixProfile, MatrixField, TranscodingField, WateringFields, WateringBaseline, sequelize) {
    this.MatrixProfile = MatrixProfile
    this.MatrixField = MatrixField
    this.TranscodingField = TranscodingField
    this.WateringFields = WateringFields
    this.WateringBaseline = WateringBaseline
    this.sequelize = sequelize

    MatrixField.hasMany(MatrixProfile, { foreignKey: 'matrixId' });
    MatrixProfile.belongsTo(MatrixField, { foreignKey: 'matrixId' });
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

      this.WateringFields.removeAttribute('id')
      const sectorFields = await this.WateringFields.findAll({
        where: {
          refStructureName: refStructureName,
          companyName: companyName,
          fieldName: fieldName,
          sectorName: sectorName
        }
      })

      if( sectorFields.length > 0){
        const newMatrixId = !matrixId ? await this.MatrixProfile.max('matrixId') + 1 : matrixId
    
        for( const field of sectorFields){
          const model = this.MatrixField.build({
            refStructureName: field.refStructureName,
            companyName: field.companyName,
            fieldName: field.fieldName,
            sectorName: field.sectorName,
            plantRow: field.plantRow,
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

  async getCurrentWaterAdvice(refStructureName, companyName, fieldName, sectorName, plantRow) {

    const query = `
            SELECT t1.advice, timestamp, "wateringHour"
        FROM 
            watering_advice t1
        INNER JOIN (
            SELECT
                "source",
                "refStructureName",
                "companyName",
                "fieldName",
                sectorName,
                plantRow,
                MAX(timestamp) as max_timestamp
            FROM
                watering_advice
            WHERE
                "refStructureName" = '${refStructureName}' AND
                "companyName" = '${companyName}' AND
                "fieldName" = '${fieldName}' AND
                sectorName = '${sectorName}' AND
                plantRow = '${plantRow}'
            GROUP BY
                "source",
                "refStructureName",
                "companyName",
                "fieldName",
                sectorName, 
                plantRow
        ) t2 ON t1."refStructureName" = t2."refStructureName"
            AND t1."companyName" = t2."companyName"
            AND t1."fieldName" = t2."fieldName"
            AND t1.sectorName = t2.sectorName
            AND t1.plantRow = t2.plantRow
            AND t1.timestamp = t2.max_timestamp`

    const result = await this.sequelize.query(query, {
      type: QueryTypes.SELECT,
      bind: {
        refStructureName,
        companyName,
        fieldName,
        sectorName,
        plantRow
      }
    });

    if(result && result.length === 1) {
      return new WateringAdviceDto(result[0].advice, new Date(result[0].timestamp * 1000).toISOString(), new Date(result[0].wateringHour * 1000).toISOString())
    } else return new WateringAdviceDto(-1, -1, -1)
  }

  async createTranscodingField(source, refStructureName, companyName, fieldName, coltureType, sectorName, wateringcapacity, initialwatering, maximumwatering, advicetime, wateringtype, adviceweight, plantRowname, sensorNumber, sensorid, sensorname, sensortype, x, y, z) {
    const model = this.TranscodingField.build({
      source: source,
      refStructureName: refStructureName,
      companyName: companyName,
      fieldName: fieldName,
      coltureType: coltureType,
      sectorName: sectorName,
      wateringcapacity: wateringcapacity,
      initialwatering: initialwatering,
      maximumwatering: maximumwatering,
      advicetime: advicetime,
      wateringtype: wateringtype,
      adviceweight: adviceweight,
      plantRow: plantRowname,
      sensorNumber: sensorNumber,
      sensorid: sensorid,
      sensorname: sensorname,
      sensortype: sensortype,
      x: x,
      y: y,
      z: z
    });
    this.TranscodingField.removeAttribute('id')
    return model.save()
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
      this.WateringFields.removeAttribute('id')
      const result = await this.WateringFields.findOne({
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

  async setWateringBaseline(baseline){
    this.WateringBaseline.removeAttribute('id')
    const currentTimestamp = Math.floor(Date.now()/1000)
    this.WateringBaseline.update(
      { 
        timestamp_to: currentTimestamp,
      },
      {
        where: {
          refStructureName: baseline.refStructureName,
          companyName: baseline.companyName,
          fieldName: baseline.fieldName,
          sectorName: baseline.sectorName,
          timestamp_from: { [Op.lt]: currentTimestamp },
          timestamp_to: {
            [Op.or]: {
              [Op.is]: null,
              [Op.gt]: currentTimestamp
            },
          }
        }
      }
    )
    const model = this.WateringBaseline.build({
      refStructureName: baseline.refStructureName,
      companyName: baseline.companyName,
      fieldName: baseline.fieldName,
      sectorName: baseline.sectorName,
      irrigation_master_thesis: baseline.irrigationMasterThesis,
      timestamp_from: currentTimestamp,
      max_irrigation: baseline.maxIrrigation,
      watering_capacity: baseline.wateringCapacity,
      irrigation_baseline: baseline.irrigationBaseline,
      watering_hour: baseline.wateringHour,
      valve_id: baseline.valveId,
      sprinkler_capacity: baseline.sprinklerCapacity
    });
    return model.save()
  }

  async disableWateringBaseline(refStructureName, companyName, fieldName, sectorName, timestamp){
    await this.WateringBaseline.update(
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

  async disablePrescriptiveField(refStructureName, companyName, fieldName, sectorName, timestamp){
    // Disable all thesis of a sector
    await this.WateringFields.update(
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
import { Model, DataTypes } from 'sequelize'

class MatrixField extends Model {

}

function initMatrixField(sequelize) {

  MatrixField.init({
      matrixId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      source: {
        type: DataTypes.STRING,
        allowNull: false
      },
      refStructureName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      companyName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fieldName: {
        type: DataTypes.STRING,
        allowNull: false
      },
    sectorName: {
        type: DataTypes.STRING,
        allowNull: false
      },
    thesisName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      timestamp_from: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      timestamp_to: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      current: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      }
    }, {
      modelName: 'field_matrix',
      timestamps: false,
      sequelize
    }
  )

  return MatrixField
}

export default initMatrixField
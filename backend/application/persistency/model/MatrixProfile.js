import { Model, DataTypes } from 'sequelize';

class MatrixProfile extends Model {

}

function initMatrixProfile(sequelize) {

  MatrixProfile.init({
      matrixId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      xx: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      yy: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      zz: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      optValue: {
        type: DataTypes.DOUBLE,
        allowNull: false
      },
      weight: {
        type: DataTypes.DOUBLE,
        allowNull: false
      }
    }, {
      modelName: 'matrix_profile',
      timestamps: false,
      sequelize
    }
  )

  return MatrixProfile;
}

export default initMatrixProfile
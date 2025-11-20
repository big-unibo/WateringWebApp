import { Model, DataTypes } from 'sequelize'

class GridOptimalProfileAssignment extends Model {

}

function initGridOptimalProfileAssignment(sequelize) {

  GridOptimalProfileAssignment.init({
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      optimalProfileId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'optimal_profile_id'
      },
      validFrom: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        field: 'valid_from'
      },
      validTo: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        field: 'valid_to'
      },
      gridId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'grid_id'
      },
      stopPercentage: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        field: 'stop_percentage'
      },
      optimalDryBound: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        field: 'optimal_dry_bound'
      },
      optimalWetBound: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        field: 'optimal_wet_bound'
      },
    }, {
      modelName: 'GridOptimalProfileAssignment',
      tableName: 'grid_optimal_profile_assignment',
      timestamps: false,
      sequelize
    }
  )

  return GridOptimalProfileAssignment
}

export default initGridOptimalProfileAssignment
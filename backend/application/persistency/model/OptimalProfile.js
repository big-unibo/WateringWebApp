import { Model, DataTypes } from 'sequelize';

class OptimalProfile extends Model {

}

function initOptimalProfile(sequelize) {

  OptimalProfile.init({
    profileId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'profile_id'
    },
    x: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    y: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    z: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    alue: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    weight: {
      type: DataTypes.DOUBLE,
      allowNull: false
    }
  }, {
    modelName: 'optimal_profiles',
    timestamps: false,
    sequelize
  }
  )

  return OptimalProfile;
}

export default initOptimalProfile
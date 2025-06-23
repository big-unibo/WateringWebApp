import { Model, DataTypes } from 'sequelize';

class FieldsPermit extends Model {

}

function initFieldsPermit(sequelize) {
  FieldsPermit.init({
    userid: {
      type: DataTypes.STRING,
      allowNull: false
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
    plantRow: {
      type: DataTypes.STRING,
      allowNull: false
    },
    permit: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    modelName: 'permit_fields',
    timestamps: false,
    sequelize
  });

  return FieldsPermit;
}

export default initFieldsPermit;
import { Model, DataTypes } from 'sequelize';

class Permit extends Model {}

function initPermit(sequelize) {
  Permit.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    table: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    role: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    idKey: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "id_key"
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id"
    },
    extraAttributes: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "extra_attributes"
    }
  }, {
    tableName: 'permits',     
    modelName: 'Permit',      
    timestamps: false,
    sequelize
  });

  return Permit;
}

export default initPermit;

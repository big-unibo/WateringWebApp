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
      allowNull: false
    },
    permit: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    id_key: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
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

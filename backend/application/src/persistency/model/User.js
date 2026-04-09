import { Model, DataTypes } from 'sequelize';

class User extends Model {}

function initUser(sequelize) {
  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      field: "created_at"
    },
    disabledAt: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      field: "disabled_at"
    }
  }, {
    tableName: 'users', 
    modelName: 'User',  
    timestamps: false,  
    sequelize
  });

  return User;
}

export default initUser;

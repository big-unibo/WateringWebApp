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

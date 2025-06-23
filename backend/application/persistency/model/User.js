import { Model, DataTypes } from 'sequelize';

class User extends Model {

}

function initUser(sequelize) {
    User.init({
        userid: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        auth_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        affiliation: {
          type: DataTypes.STRING,
          allowNull: true
        },
        pwd: {
            type: DataTypes.STRING,
            allowNull: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        modelName: 'users',
        timestamps: false,
        sequelize
    });

    return User;
}

export default initUser;
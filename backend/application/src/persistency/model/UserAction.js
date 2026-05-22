import { Model, DataTypes } from 'sequelize';

class UserAction extends Model {

}

function initUserAction(sequelize) {
    UserAction.init({
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "user_id"
        },
        action: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        table: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        idKey: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            field: "id_key"
        },
        timestamp: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        payload: {
            type: DataTypes.JSONB,
            allowNull: true
        }
    }, {
        tableName : 'users_actions',
        modelName : 'UserAction',
        timestamps : false,
        sequelize
    });

    return UserAction
}

export default initUserAction
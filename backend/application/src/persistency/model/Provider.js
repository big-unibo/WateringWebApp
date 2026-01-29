import { Model, DataTypes } from 'sequelize';

class Provider extends Model {

}

function initProvider(sequelize) {
    Provider.init({
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: "provider_name",
        }
    }, {
        tableName : 'providers',
        modelName : 'Provider',
        timestamps : false,
        sequelize
    });

    return Provider
}

export default initProvider
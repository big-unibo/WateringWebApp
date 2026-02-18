import { Model, DataTypes } from 'sequelize';

class Service extends Model {

}

function initService(sequelize) {
    Service.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        serviceName: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: "service_name"
        }
    }, {
        modelName: 'Service',
        tableName: 'services',
        timestamps: false,
        sequelize
    });

    return Service;
}

export default initService;
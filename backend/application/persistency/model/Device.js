import { Model, DataTypes } from 'sequelize';

class Device extends Model {

}

function initDevice(sequelize) {
    Device.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id"
        },
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: "type"
        },
        providerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "provider_id"
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "type"
        },
        location: {
            type: DataTypes.GEOMETRY,
            allowNull: false,
            field: "location"
        },
        binningId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "binning_id"
        }
    }, {
        tableName : 'devices',
        modelName : 'Device',
        timestamps : false,
        sequelize
    });

    return Device;
}

export default initDevice;
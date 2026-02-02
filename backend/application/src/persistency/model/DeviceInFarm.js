import { Model, DataTypes } from 'sequelize';

class DeviceInFarm extends Model {}

function initDeviceInFarm(sequelize) {
    DeviceInFarm.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id"
        },
        farmId: {
            type: DataTypes.INTEGER,
            field: "farm_id",
            allowNull: false
        },
        deviceId: {
            type: DataTypes.INTEGER,
            field: "device_id",
            allowNull: false
        },
        validFrom: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            field: "valid_from"
        },
        validTo: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "valid_to"
        },
    }, {
        tableName : 'farms_devices',
        modelName : 'DeviceInFarm',
        timestamps : false,
        sequelize
    });

    return DeviceInFarm;
}

export default initDeviceInFarm;
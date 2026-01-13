import { Model, DataTypes } from 'sequelize';

class DeviceInThesis extends Model {}

function initDeviceInThesis(sequelize) {
    DeviceInThesis.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id"
        },
        deviceId: {
            type: DataTypes.INTEGER,
            field: "device_id",
            allowNull: false
        },
        thesisId: {
            type: DataTypes.INTEGER,
            field: "thesis_id",
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
        tableName : 'theses_devices',
        modelName : 'DeviceInThesis',
        timestamps : false,
        sequelize
    });

    return DeviceInThesis;
}

export default initDeviceInThesis;
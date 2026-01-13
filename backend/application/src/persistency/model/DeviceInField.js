import { Model, DataTypes } from 'sequelize';

class DeviceInField extends Model {}

function initDeviceInField(sequelize) {
    DeviceInField.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id"
        },
        fieldId: {
            type: DataTypes.INTEGER,
            field: "field_id",
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
        tableName : 'fields_devices',
        modelName : 'DeviceInField',
        timestamps : false,
        sequelize
    });

    return DeviceInField;
}

export default initDeviceInField;
import { Model, DataTypes } from 'sequelize';

class DeviceInSector extends Model {}

function initDeviceInSector(sequelize) {
    DeviceInSector.init({
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
        sectorId: {
            type: DataTypes.INTEGER,
            field: "sector_id",
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
        tableName : 'sectors_devices',
        modelName : 'DeviceInSector',
        timestamps : false,
        sequelize
    });

    return DeviceInSector;
}

export default initDeviceInSector;
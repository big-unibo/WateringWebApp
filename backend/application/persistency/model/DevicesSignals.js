import { Model, DataTypes } from 'sequelize';

class DevicesSignals extends Model {

}

function initDevicesSignals(sequelize) {
    DevicesSignals.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id"
        },
        deviceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "device_id"
        },
        signalId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "signal_id"
        },
        validFrom: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "valid_from"
        },
        validTo: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "valid_to"
        }
    }, {
        tableName : 'devices_signals',
        modelName : 'DevicesSignals',
        timestamps : false,
        sequelize
    });

    return DevicesSignals;
}

export default initDevicesSignals;
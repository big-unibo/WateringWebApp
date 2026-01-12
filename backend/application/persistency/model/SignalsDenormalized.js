import { Model, DataTypes } from 'sequelize';

class SignalsDenormalized extends Model {

}

function initSignalsDenormalized(sequelize) {
    SignalsDenormalized.init({
        signalId: {
            type: DataTypes.INTEGER,
            field: "signal_id"
        },
        signalDescription: {
            type: DataTypes.TEXT,
            field: "signal_description"
        },
        signalType: {
            type: DataTypes.TEXT,
            field: "signal_type"
        },
        signalTypeDescription: {
            type: DataTypes.TEXT,
            field: "signal_type_description"
        },
        deviceId: {
            type: DataTypes.INTEGER,
            field: "device_id"
        },
        deviceDescription: {
            type: DataTypes.TEXT,
            field: "device_description"
        },
        deviceType: {
            type: DataTypes.TEXT,
            field: "device_type"
        },
        deviceBinningId: {
            type: DataTypes.INTEGER,
            field: "device_binning_id"
        },
        x: {
            type: DataTypes.DOUBLE,
            field: "x"
        },
        y: {
            type: DataTypes.DOUBLE,
            field: "y"
        },
        z: {
            type: DataTypes.DOUBLE,
            field: "z"
        },
        virtual: {
            type: DataTypes.BOOLEAN,
            field: "virtual"
        },
        unit: {
            type: DataTypes.TEXT,
            field: "unit"
        },
        sensorTechnology: {
            type: DataTypes.TEXT,
            field: "sensor_technology"
        },
        idOnProvider: {
            type: DataTypes.TEXT,
            field: "signal_id_on_provider"
        },
        providerId: {
            type: DataTypes.INTEGER,
            field: "provider_id"
        },
        validFrom: {
            type: DataTypes.DOUBLE,
            field: "valid_from"
        },
        validTo: {
            type: DataTypes.DOUBLE,
            field: "valid_to"
        }
    }, {
        modelName: 'SignalsDenormalized',
        tableName: 'devices_signals_denormalized',
        timestamps: false,
        primaryKey: false,
        sequelize
    });

    return SignalsDenormalized
}

export default initSignalsDenormalized;
import { Model, DataTypes } from 'sequelize';

class ThesesAllSignals extends Model {

}

function initThesesAllSignals(sequelize) {
    ThesesAllSignals.init({
        organizationId: {
            type: DataTypes.INTEGER,
            field: "organization_id"
        },
        organizationName: {
            type: DataTypes.STRING,
            field: "organization_name"
        },
        companyId: {
            type: DataTypes.INTEGER,
            field: "company_id"
        },
        companyName: {
            type: DataTypes.TEXT,
            field: "company_name"
        },
        fieldId: {
            type: DataTypes.INTEGER,
            field: "field_id"
        },
        fieldName: {
            type: DataTypes.TEXT,
            field: "field_name"
        },
        sectorId: {
            type: DataTypes.INTEGER,
            field: "sector_id"
        },
        sectorName: {
            type: DataTypes.TEXT,
            field: "sector_name"
        },
        thesisId: {
            type: DataTypes.INTEGER,
            field: "thesis_id"
        },
        thesisName: {
            type: DataTypes.TEXT,
            field: "thesis_name"
        },
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
        validFrom: {
            type: DataTypes.DOUBLE,
            field: "valid_from"
        },
        validTo: {
            type: DataTypes.DOUBLE,
            field: "valid_to"
        },
        associationType: {
            type: DataTypes.TEXT,
            field: "association_type"
        }

    }, {
        modelName: 'ThesesAllSignals',
        tableName: 'theses_all_signals',
        timestamps: false,
        primaryKey: false,
        sequelize
    });

    return ThesesAllSignals
}

export default initThesesAllSignals;
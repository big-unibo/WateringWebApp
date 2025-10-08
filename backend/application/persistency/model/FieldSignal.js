import { Model, DataTypes } from 'sequelize';

class FieldSignal extends Model {}

function initFieldSignal(sequelize) {
    FieldSignal.init({
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
        signalId: {
            type: DataTypes.INTEGER,
            field: "signal_id",
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
        tableName : 'fields_signals',
        modelName : 'FieldSignal',
        timestamps : false,
        sequelize
    });

    return FieldSignal;
}

export default initFieldSignal;
import { Model, DataTypes } from 'sequelize';

class SignalInThesis extends Model {}

function initSignalInThesis(sequelize) {
    SignalInThesis.init({
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
        tableName : 'theses_signals',
        modelName : 'SignalInThesis',
        timestamps : false,
        sequelize
    });

    return SignalInThesis;
}

export default initSignalInThesis;
import { Model, DataTypes } from 'sequelize';

class ThesisSignal extends Model {}

function initThesisSignal(sequelize) {
    ThesisSignal.init({
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
        modelName : 'ThesisSignal',
        timestamps : false,
        sequelize
    });

    return ThesisSignal;
}

export default initThesisSignal;
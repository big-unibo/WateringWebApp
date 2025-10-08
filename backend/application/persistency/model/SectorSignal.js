import { Model, DataTypes } from 'sequelize';

class SectorSignal extends Model {}

function initSectorSignal(sequelize) {
    SectorSignal.init({
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
        tableName : 'sectors_signals',
        modelName : 'SectorSignal',
        timestamps : false,
        sequelize
    });

    return SectorSignal;
}

export default initSectorSignal;
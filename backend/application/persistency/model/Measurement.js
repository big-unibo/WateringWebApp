import { Model, DataTypes } from 'sequelize';

class Measurement extends Model { }

function initMeasurement(sequelize){
    Measurement.init({
        signalId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "signal_id"
        },     
        timestamp: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            field: "timestamp"
        },
        computed: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            field: "computed"
        },
        date: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "date"
        },
        time: {
            type: DataTypes.TIME,
            allowNull: true,
            field: "time"
        },
        value: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "value"
        },
        rawValue: {
            type: DataTypes.JSON,
            allowNull: true,
            field: "raw_value"
        },
    })

    return Measurement;

}

export default initMeasurement;
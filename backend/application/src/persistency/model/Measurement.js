import { Model, DataTypes } from 'sequelize';

class Measurement extends Model { }

function initMeasurement(sequelize){
    Measurement.init({
        signalId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "signal_id",
            primaryKey: true
        },     
        timestamp: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            field: "timestamp",
            primaryKey: true
        },
        computed: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            field: "computed"
        },
        date: {
            type: DataTypes.DATEONLY,
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
            type: DataTypes.TEXT,
            allowNull: true,
            field: "raw_value"
        },
    }, {
        modelName: 'Measurement',
        tableName: 'measurements',
        timestamps: false,
        sequelize
    })

    return Measurement;

}

export default initMeasurement;
import { Model, DataTypes } from 'sequelize';

class WateringEvent extends Model { }

function initWateringEvent(sequelize) {
    WateringEvent.init({
        id: {
            type: DataTypes.INTEGER,
            field: "id",
            primaryKey: true
        },
        sectorId: {
            type: DataTypes.INTEGER,
            field: "sector_id",
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "date"
        },
        wateringStart: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            field: "watering_start"
        },
        wateringEnd: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "watering_end"
        },
        advice: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "advice"
        },
        duration: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "duration"
        },
        expectedWater: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "expected_water"
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "note"
        },
        enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            field: "enabled"
        }
    }, {
        modelName: 'watering_events',
        timestamps: false,
        sequelize
    });

    return WateringEvent;
}

export default initWateringEvent;

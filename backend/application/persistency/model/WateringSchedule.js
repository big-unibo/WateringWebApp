import { Model, DataTypes } from 'sequelize';

class WateringSchedule extends Model { }

function initWateringSchedule(sequelize) {
    WateringSchedule.init({
        source: DataTypes.TEXT,
        refStructureName: DataTypes.TEXT,
        companyName: DataTypes.TEXT,
        fieldName: DataTypes.TEXT,
        sectorName: DataTypes.TEXT,
        plantRow: DataTypes.TEXT,
        date: DataTypes.DATEONLY,
        watering_start: DataTypes.DOUBLE,
        watering_end: DataTypes.DOUBLE,
        duration: DataTypes.DOUBLE,
        enabled: DataTypes.BOOLEAN,
        latest: DataTypes.BOOLEAN,
        expected_water: DataTypes.DOUBLE,
        advice: DataTypes.DOUBLE,
        advice_timestamp: DataTypes.DOUBLE,
        userId: DataTypes.INTEGER,
        update_timestamp: DataTypes.DOUBLE,
        note: DataTypes.TEXT,
        evapotrans: DataTypes.DOUBLE,
        r: DataTypes.DOUBLE,
        pluv: DataTypes.DOUBLE,
        delta: DataTypes.DOUBLE,
        kp: DataTypes.DOUBLE,
        ki: DataTypes.DOUBLE,
        deleted: DataTypes.BOOLEAN
    }, {
        modelName: 'watering_schedule',
        timestamps: false,
        sequelize
    });

    return WateringSchedule;
}

export default initWateringSchedule;

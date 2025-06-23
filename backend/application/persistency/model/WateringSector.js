import { Model, DataTypes } from 'sequelize';

class WateringSector extends Model {

}

function initWateringSector(sequelize) {

    WateringSector.init({
        source: DataTypes.TEXT,
        refStructureName: DataTypes.TEXT,
        companyName: DataTypes.TEXT,
        fieldName: DataTypes.TEXT,
        sectorName: DataTypes.TEXT,
        prescriptive: DataTypes.BOOLEAN,
        advice: DataTypes.BOOLEAN,
        dripper_capacity: DataTypes.DOUBLE,
        dripper_scaling_factor: DataTypes.DOUBLE,
        sprinkler_capacity: DataTypes.DOUBLE,
        valve_id: DataTypes.TEXT,
        timestamp_from: DataTypes.DOUBLE,
        timestamp_to: DataTypes.DOUBLE
    }, {
        modelName: 'watering_sector',
        timestamps: false,
        sequelize
    });

    return WateringSector;
}

export default initWateringSector;
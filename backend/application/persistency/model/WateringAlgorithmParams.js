import { Model, DataTypes } from 'sequelize';

class WateringAlgorithmParams extends Model { }

function initWateringAlgorithmParams(sequelize) {
    WateringAlgorithmParams.init({
        source: DataTypes.TEXT,
        refStructureName: DataTypes.TEXT,
        companyName: DataTypes.TEXT,
        fieldName: DataTypes.TEXT,
        sectorName: DataTypes.TEXT,
        timestamp_from: DataTypes.DOUBLE,
        timestamp_to: DataTypes.DOUBLE,
        max_irrigation: DataTypes.DOUBLE,
        irrigation_baseline: DataTypes.DOUBLE,
        watering_hour: DataTypes.TIME,
        ki: DataTypes.DOUBLE,
        kp: DataTypes.DOUBLE
    }, {
        modelName: 'watering_algorithm_params',
        timestamps: false,
        sequelize
    });

    return WateringAlgorithmParams;
}

export default initWateringAlgorithmParams;

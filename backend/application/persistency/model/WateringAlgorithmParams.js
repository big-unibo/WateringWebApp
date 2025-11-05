import { Model, DataTypes } from 'sequelize';

class WateringAlgorithmParams extends Model { }

function initWateringAlgorithmParams(sequelize) {
    WateringAlgorithmParams.init({
        thesisId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "thesis_id"
        },
        minWatering: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "min_watering"
        },
        maxWatering: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "max_watering"
        },
        wateringBaseline: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        wateringFrequency: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "watering_frequency"
        },
        ki: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        kp: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
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
        errorFunction: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "error_function"
        }
    }, {
        tableName: 'watering_algorithm_params',
        modelName: 'WateringAlgorithmParams',
        timestamps: false,
        sequelize
    });

    return WateringAlgorithmParams;
}

export default initWateringAlgorithmParams;

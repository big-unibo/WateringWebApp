import { Model, DataTypes } from 'sequelize';

class Advice extends Model {

}

function initAdvice(sequelize) {
    Advice.init({
        thesisId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "thesis_id",
            primaryKey: true
        },
        wateringStart: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            field: "watering_start",
            primaryKey: true
        },
        imageTimestamp: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "image_timestamp"
        },
        advice: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        duration: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        r: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        evapotranspiration: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        pluv: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        lastWatering: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "last_watering"
        },        
    }, {
        tableName : 'advices',
        modelName : 'Advice',
        timestamps : false,
        
        sequelize
    });

    return Advice;
}

export default initAdvice;
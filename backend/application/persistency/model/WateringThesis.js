import { Model, DataTypes } from 'sequelize';

class WateringThesis extends Model {

}

function initWateringThesis(sequelize) {

    WateringThesis.init({
        source: DataTypes.TEXT,
        refStructureName: DataTypes.TEXT,
        companyName: DataTypes.TEXT,
        fieldName: DataTypes.TEXT,
        sectorName: DataTypes.TEXT,
        plantRow: DataTypes.TEXT,
        timestamp_from: DataTypes.DOUBLE,
        timestamp_to: DataTypes.DOUBLE,
        dripper_pos: DataTypes.INTEGER,
        weight: DataTypes.DOUBLE
    }, {
        modelName: 'watering_thesis',
        timestamps: false,
        sequelize
    });

    return WateringThesis;
}

export default initWateringThesis;
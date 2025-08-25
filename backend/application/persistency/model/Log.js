import { Model, DataTypes } from 'sequelize';

class Log extends Model { }

function initLog(sequelize) {
    Log.init({
        refStructureName: DataTypes.TEXT,
        companyName: DataTypes.TEXT,
        fieldName: DataTypes.TEXT,
        sectorName: DataTypes.TEXT,
        thesisName: DataTypes.TEXT,
        timestamp: DataTypes.DOUBLE,
        type: DataTypes.TEXT,
        description: DataTypes.TEXT
    }, {
        modelName: 'watering_logs',
        timestamps: false,
        sequelize
    });

    return Log;
}

export default initLog;

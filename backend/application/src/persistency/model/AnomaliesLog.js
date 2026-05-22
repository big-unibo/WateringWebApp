import { Model, DataTypes } from 'sequelize';

class AnomaliesLog extends Model { }

function initLog(sequelize) {
    AnomaliesLog.init({
        table: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        idKey: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "id_key"
        },
        timestamp: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        agent: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'anomalies_logs',         
        timestamps: false,
        sequelize
    });

    return AnomaliesLog;
}

export default initLog;

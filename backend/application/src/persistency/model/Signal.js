import { Model, DataTypes } from 'sequelize';

class Signal extends Model {

}

function initSignal(sequelize) {
    Signal.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id"
        },
        typeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "type_id"
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "description"
        },
        x: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "x"
        },
        y: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "y"
        },
        z: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "z"
        },
        virtual: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            field: "virtual"
        },
        unit: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "unit"
        },
        providerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "provider_id"
        },
        idOnProvider: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "id_on_provider"
        }, 
        sensorTechnology: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "sensor_technology"
        },
        createdAt: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            field: "created_at"
        },
        disabledAt: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "disabled_at"
        }
    }, {
        tableName : 'signals',
        modelName : 'Signal',
        timestamps : false,
        sequelize
    });

    return Signal;
}

export default initSignal;
import { Model, DataTypes } from 'sequelize';

class SignalType extends Model {

}

function initSignalType(sequelize) {
    SignalType.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: "type"
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "type_description"
        }
    }, {
        modelName: 'SignalType',
        tableName: 'signal_types',
        timestamps: false,
        sequelize
    });

    return SignalType;
}

export default initSignalType;
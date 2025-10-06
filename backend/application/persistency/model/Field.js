import { Model, DataTypes } from 'sequelize';

class Field extends Model {

}

function initField(sequelize) {
    Field.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        field_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        location: {
            type: DataTypes.GEOMETRY,
            allowNull: false
        }
    }, {
        modelName : 'fields',
        timestamps : false,
        sequelize
    });

    return Field;
}

export default initField;
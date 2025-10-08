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
        fieldName: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: "field_name"
        },
        companyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "company_id"
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
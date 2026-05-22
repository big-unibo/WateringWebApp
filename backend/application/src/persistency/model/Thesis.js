import { Model, DataTypes } from 'sequelize';

class Thesis extends Model {

}

function initThesis(sequelize) {
    Thesis.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        thesisName: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: "thesis_name"
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
        tableName : 'theses',
        modelName : 'Thesis',
        timestamps : false,
        sequelize
    });

    return Thesis;
}

export default initThesis;
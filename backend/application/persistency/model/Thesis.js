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
            type: DataTypes.STRING,
            allowNull: false,
            field: "thesis_name"
        },

    }, {
        tableName : 'theses',
        modelName : 'Thesis',
        timestamps : false,
        sequelize
    });

    return Thesis;
}

export default initThesis;
import { Model, DataTypes } from 'sequelize';

class Farm extends Model {

}

function initFarm(sequelize) {
    Farm.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        farmName: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: "farm_name"
        },
        companyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "company_id"
        },
        location: {
            type: DataTypes.GEOMETRY,
            allowNull: true
        },
        disabledAt: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "disabled_at"
        }
    }, {
        tableName : 'farms', 
        modelName : 'Farm',
        timestamps : false,
        sequelize
    });

    return Farm;
}

export default initFarm;
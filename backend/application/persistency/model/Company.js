import { Model, DataTypes } from 'sequelize';

class Company extends Model {

}

function initCompany(sequelize) {
    Company.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        company_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        organization_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        tableName : 'companies',
        modelName : 'Company',
        timestamps : false,
        sequelize
    });

    return Company;
}

export default initCompany;
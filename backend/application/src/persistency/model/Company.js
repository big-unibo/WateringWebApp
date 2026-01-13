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
        companyName: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: "company_name"
        },
        organizationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "organization_id"
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
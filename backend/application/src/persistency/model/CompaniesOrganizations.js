import { Model, DataTypes } from 'sequelize';

class CompaniesOrganizations extends Model {

}

function initCompaniesOrganizations(sequelize) {
    CompaniesOrganizations.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        companyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "company_id"
        },
        organizationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "organization_id"
        }
    }, {
        tableName : 'companies_organizations',
        modelName : 'CompaniesOrganization',
        timestamps : false,
        sequelize
    });

    return CompaniesOrganizations;
}

export default initCompaniesOrganizations;
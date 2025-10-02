import { Model, DataTypes } from 'sequelize';

class Organization extends Model {

}

function initOrganization(sequelize) {
    Organization.init({
        organizationid: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        organization_name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        modelName: 'organization',
        timestamps: false,
        sequelize
    });

    return Organization;
}

export default initOrganization;
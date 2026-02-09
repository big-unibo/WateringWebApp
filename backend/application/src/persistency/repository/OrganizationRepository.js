import { Op } from "sequelize";

class OrganizationRepository {
    constructor(models, sequelize) {
        this.Organization = models.Organization;
        this.CompaniesOrganizations = models.CompaniesOrganizations
        this.Company = models.Company;
        this.sequelize = sequelize;
    }

    async createOrganization(organizationName) {
        try {
            const organizationCreated = await this.Organization.create({
                organizationName
            });
            return organizationCreated;
        } catch (error) {
            throw new Error(`Error creating new organization caused by: ${error.message}`);
        }
    }

    async getOrganizations(filteringIds) {
        try {
            const where = {};

            if (Array.isArray(filteringIds)) {
                if (filteringIds.length > 0) {
                    where.id = {
                        [Op.in]: filteringIds
                    }
                } else {
                    return []
                }
            }
            const organizations = await this.Organization.findAll({ where })
            return organizations;
        } catch (error) {
            throw new Error(`Error retrieving organizations caused by: ${error.message}`);
        }
    }

    async getOrganizationDetails(organizationId) {
        try {
            const organization = await this.Organization.findOne({
                where: { id: organizationId },
                include: [{
                    model: this.CompaniesOrganizations,
                    as: 'companies',
                    include: [
                        {
                            model: this.Company,
                            as: 'company'
                        }
                    ]
                }]
            });
            return organization;
        } catch (error) {
            throw new Error(`Error retrieving organization details caused by: ${error.message}`);
        }
    }
}


export default OrganizationRepository
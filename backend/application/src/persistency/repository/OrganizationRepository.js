class OrganizationRepository {
    constructor(models, sequelize) {
        this.Organization = models.Organization;
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

    async getOrganizations() {
        try {
            const organizations = await this.Organization.findAll()
            return organizations;
        } catch (error) {
            throw new Error(`Error retrieving organizations caused by: ${error.message}`);
        }
    }

    async getOrganizationDetails(organizationId) {
        try {
            const organization = await this.Organization.findOne({
                where: { id: organizationId },
                include: [
                        {
                            model: this.Company,
                            as: 'companies',
                            required: false
                        }
                    ],
            });
            return organization;
        } catch (error) {
            throw new Error(`Error retrieving organization details caused by: ${error.message}`);
        }
    }
}


export default OrganizationRepository
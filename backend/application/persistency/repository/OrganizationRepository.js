class OrganizationRepository {
    constructor(models, sequelize) {
        this.Organization = models.Organization;
        this.sequelize = sequelize;
    }

    async createOrganization(organization_name) {
        try {
            const organizationCreated = await this.Organization.create({
            organization_name
            });
            return organizationCreated;
        } catch (error) {
            throw new Error(`Error creating new organization caused by: ${error.message}`);
        }
    }
}


export default OrganizationRepository
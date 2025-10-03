class OrganizationRepository {
    constructor(models, sequelize) {
        this.Organization = models.Organization;
        this.sequelize = sequelize;
    }

    async createOrganization(organization_name) {
        try {
            const maxId = await this.Organization.max('id') || 0;
            const organizationCreated = this.Organization.build({
                id: maxId + 1,
                organization_name: organization_name
            });

            return await organizationCreated.save();
        } catch (error) {
            throw new Error(`Error creating new organization caused by: ${error.message}`);
        }
    }
}


export default OrganizationRepository
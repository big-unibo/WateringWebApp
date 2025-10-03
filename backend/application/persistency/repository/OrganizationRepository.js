
class OrganizationRepository {
    constructor(Organization) {
        this.Organization = Organization;
    }

    async createOrganization(organization_name) {
        try {
            const maxId = await this.Organization.max('organizationid') || 0;
            const organizationCreated = this.Organization.build({
                organizationid: maxId + 1,
                organization_name: organization_name
            });

            return await organizationCreated.save();
        } catch (error) {
            throw new Error(`Error creating new organization caused by: ${error.message}`);
        }
    }
}


export default OrganizationRepository
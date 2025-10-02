
class OrganizationRepository {

    constructor(Organization) {
        this.Organization = Organization;
    }

    async createOrganization(organization_name) {
        try{
            let organizationCreated = this.Organization.buid({
                organizationid: await this.Organization.max('organizationid') + 1,
                organization_name: organization_name
            })
            return await organizationCreated.save();
        } catch (error){
            throw Error(`Error creating new organization caused by: ${error.message}`)
        }
    }
}

export default OrganizationRepository
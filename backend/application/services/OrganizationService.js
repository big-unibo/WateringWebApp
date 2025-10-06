class OrganizationService {
    constructor(organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    async createOrganization(organization){ 
        try {
            await this.organizationRepository.createOrganization(organization.organizationName);
        } catch (error) {
            console.error(`Error creating organization ${organization.organizationName}: ${error.message}`);
            throw error;
        }    
    }
}

export default OrganizationService
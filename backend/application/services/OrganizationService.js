class OrganizationService {
    constructor(organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    async createOrganization(organizationName){ 
        try {
            await this.organizationRepository.createOrganization(organizationName);
        } catch (error) {
            console.error(`Error creating organization ${organizationName}: ${error.message}`);
            throw error;
        }    
    }
}

export default OrganizationService
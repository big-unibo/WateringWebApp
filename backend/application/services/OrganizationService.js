class OrganizationService {
    constructor(organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    async createOrganization(request){ 
        try {
            await this.organizationRepository.createOrganization(request.organizationName);
        } catch (error) {
            console.error(`Error creating organization ${request.organizationName}: ${error.message}`);
            throw error;
        }    
    }
}

export default OrganizationService
class OrganizationService {
    constructor(organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    async createOrganization(organizationName){ 
        try {
            const organizationCreated = await this.organizationRepository.createOrganization(organizationName);
            return organizationCreated.id;
        } catch (error) {
            console.error(`Error creating organization ${organizationName}: ${error.message}`);
            throw error;
        }    
    }
}

export default OrganizationService
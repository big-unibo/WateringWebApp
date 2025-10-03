class OrganizationService {
    constructor(organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    async createOrganization(organization_name){ 
        try {
            await this.organizationRepository.createOrganization(organization_name);
        } catch (error) {
            console.error(`Error creating organization ${organization_name}: ${error.message}`);
            throw error;
        }    
    }
}

export default OrganizationService
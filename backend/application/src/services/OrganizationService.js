import { ORGANIZATIONS_LOG_TABLE } from "../commons/constants.js";

class OrganizationService {
    constructor(organizationRepository, userActionService ) {
        this.organizationRepository = organizationRepository;
        this.userActionService = userActionService;
    }

    async createOrganization(userId, organizationName){ 
        try {
            const organizationCreated = await this.organizationRepository.createOrganization(organizationName);
            const organizationId =  organizationCreated.id;
            if(organizationId){
                this.userActionService.logCreation(userId, ORGANIZATIONS_LOG_TABLE, organizationId, null);
                return organizationId
            }
        } catch (error) {
            console.error(`Error creating organization ${organizationName}: ${error.message}`);
            throw error;
        }    
    }
}

export default OrganizationService
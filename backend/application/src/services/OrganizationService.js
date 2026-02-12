import { ORGANIZATIONS_LOG_TABLE } from "../commons/constants.js";
import DtoConverter from "./DtoConverter.js";

const dtoConverter = new DtoConverter();

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

    async getOrganizations(filteringIds) {
        const result = await this.organizationRepository.getOrganizations(filteringIds);
        return dtoConverter.convertOrganizationsDataWrapper(result);
    }

    async getOrganizationDetails(organizationId, userId, isAdmin) {
        const result = await this.organizationRepository.getOrganizationDetails(organizationId, userId, isAdmin);
        return dtoConverter.convertOrganizationDataWrapper(result);
    }

}

export default OrganizationService
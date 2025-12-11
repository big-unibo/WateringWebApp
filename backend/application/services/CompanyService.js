import { COMPANIES_LOG_TABLE } from "../commons/constants.js";

class CompanyService {
    constructor(companyRepository, userActionService) {
        this.companyRepository = companyRepository;
        this.userActionService = userActionService;
    }

    async createCompany(userId,company){ 
        try {
            const companyCreated = await this.companyRepository.createCompany(company.companyName,company.organizationId);
            const companyId = companyCreated.id;
            if (companyId) {
                await this.userActionService.logCreation(userId, COMPANIES_LOG_TABLE, companyId, null);
                return companyId
            }
        } catch (error) {
            console.error(`Error creating Company ${company.companyName}: ${error.message}`);
            throw error;
        }    
    }
}

export default CompanyService
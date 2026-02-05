import { COMPANIES_LOG_TABLE } from "../commons/constants.js";
import DtoConverter from "./DtoConverter.js";

const dtoConverter = new DtoConverter();

class CompanyService {
    constructor(companyRepository, userActionService) {
        this.companyRepository = companyRepository
        this.userActionService = userActionService
    }

    async createCompany(userId,company){ 
        try {
            const companyCreated = await this.companyRepository.createCompany(company.name, company.address,company.organizationIds)
            const companyId = companyCreated.id
            if (companyId) {
                await this.userActionService.logCreation(userId, COMPANIES_LOG_TABLE, companyId, null)
                return companyId
            }
        } catch (error) {
            console.error(`Error creating Company ${company.name}: ${error.message}`)
            throw error
        }    
    }

    async getCompanies(filteringIds) {
        const result = await this.companyRepository.getCompanies(filteringIds);
        return dtoConverter.convertCompanies(result);
    }

    async getCompanyDetails(companyId) {
        const result = await this.companyRepository.getCompanyDetails(companyId)
        return dtoConverter.convertCompanyDataWrapper(result)
    }
}

export default CompanyService
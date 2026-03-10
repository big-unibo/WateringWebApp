import { COMPANIES_LOG_TABLE } from "../commons/constants.js";
import DtoConverter from "./DtoConverter.js";

const dtoConverter = new DtoConverter();

class CompanyService {
    constructor(companyRepository, userActionService) {
        this.companyRepository = companyRepository
        this.userActionService = userActionService
    }

    async companyExists(companyId) {
        return await this.companyRepository.companyExists(companyId)
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

    async getCompanyDetails(companyId, userId, isAdmin) {
        const result = await this.companyRepository.getCompanyDetails(companyId, userId, isAdmin)
        return dtoConverter.convertCompanyDataWrapper(result)
    }

    async updateCompany(userId, company){
        try {
            const { id, ...fields } = company;

            const updatedCompanyInstance = await this.companyRepository.updateCompany(
                id,
                Object.fromEntries(Object.entries(fields).filter(([_, v]) => v !== undefined))
            )

            if (updatedCompanyInstance) {
                const companyData = updatedCompanyInstance.get({ plain: true });
                await this.userActionService.logUpdate(userId, COMPANIES_LOG_TABLE, id, null, companyData)
            }
        } catch (error) {
            console.error(`Error updating company: ${error.message}`);
            throw error;
        }
    }
}

export default CompanyService
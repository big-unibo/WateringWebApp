import { COMPANIES_LOG_TABLE } from "../commons/constants.js";
import DtoConverter from "./DtoConverter.js";

const dtoConverter = new DtoConverter();

class CompanyService {
    constructor(companyRepository, farmRepository, deviceRepository, deviceService, fieldService, userActionService) {
        this.companyRepository = companyRepository
        this.farmRepository = farmRepository
        this.deviceRepository = deviceRepository
        this.deviceService = deviceService
        this.fieldService = fieldService
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

    async deleteCompany(userId, companyId) {
        try {
            const companyDevices = await this.deviceRepository.getDevicesByCompany(companyId);
            if (companyDevices && Array.isArray(companyDevices)){
                await Promise.all(companyDevices.map(device=>{
                    this.deviceService.deleteDevice(userId, device.id)
                }))
            }

            const companyFarms = await this.farmRepository.getFarmsByCompany(companyId);
            if (companyFarms && Array.isArray(companyFarms)) {
                await Promise.all(companyFarms.map(farm =>
                    this.fieldService.deleteFarm(userId, farm.id)
                ));
            }

            await this.companyRepository.deleteCompany(companyId)
            await this.userActionService.logDeletion(userId, COMPANIES_LOG_TABLE, companyId)
        } catch (error) {
            console.error(`Error deleting farm: ${error.message}`);
            throw error;
        }
    }
}

export default CompanyService
import { TABLES } from "../commons/constants.js";
import { _updateEntity } from '../commons/entityServiceUtils.js';
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
            const companyCreated = await this.companyRepository.createCompany(company.name, company.address,company.organizationIds, company.createdAt)
            const companyId = companyCreated.id
            if (companyId) {
                await this.userActionService.logCreation(userId, TABLES.COMPANY, companyId, null)
                return companyId
            }
        } catch (error) {
            console.error(`Error creating Company ${company.name}: ${error.message}`)
            throw error
        }    
    }

    async getCompanies(filteringIds, timeFilterFrom, timeFilterTo) {
        const result = await this.companyRepository.getCompanies(filteringIds, timeFilterFrom, timeFilterTo);
        return dtoConverter.convertCompanies(result);
    }

    async getCompanyDetails(companyId, timeFilterFrom, timeFilterTo, userId, isAdmin) {
        const result = await this.companyRepository.getCompanyDetails(companyId, timeFilterFrom, timeFilterTo, userId, isAdmin)
        return dtoConverter.convertCompanyDataWrapper(result)
    }

    async updateCompany(userId, company){
        await _updateEntity(userId, company, this.companyRepository.updateCompany.bind(this.companyRepository), this.userActionService, TABLES.COMPANY)
    }

    async disableCompany(userId, isAdmin, companyId, validTo) {
        try {
            const companyDevices = await this.deviceRepository.getDevicesByCompany(companyId);
            if (companyDevices && Array.isArray(companyDevices)){
                await Promise.all(companyDevices.map(async device=>{
                    await this.deviceService.disableDevice(userId, device.id, validTo)
                }))
            }

            const companyFarms = await this.farmRepository.getFarmsByCompany(companyId);
            if (companyFarms && Array.isArray(companyFarms)) {
                await Promise.all(companyFarms.map(async farm =>
                    await this.fieldService.disableFarm(userId, isAdmin, farm.id, validTo)
                ));
            }

            await this.companyRepository.disableCompany(companyId, validTo)
            await this.userActionService.logDisabling(userId, TABLES.COMPANY, companyId)
        } catch (error) {
            console.error(`Error disabling company: ${error.message}`);
            throw error;
        }
    }

    async deleteCompany(userId, companyId) {
        try {
            const companyDevices = await this.deviceRepository.getDevicesByCompany(companyId);
            if (companyDevices && Array.isArray(companyDevices)){
                await Promise.all(companyDevices.map(async device=>{
                    await this.deviceService.deleteDevice(userId, device.id)
                }))
            }

            const companyFarms = await this.farmRepository.getFarmsByCompany(companyId);
            if (companyFarms && Array.isArray(companyFarms)) {
                await Promise.all(companyFarms.map(async farm =>
                    await this.fieldService.deleteFarm(userId, farm.id)
                ));
            }

            await this.companyRepository.deleteCompany(companyId)
            await this.userActionService.logDeletion(userId, TABLES.COMPANY, companyId)
        } catch (error) {
            console.error(`Error deleting company: ${error.message}`);
            throw error;
        }
    }
}

export default CompanyService
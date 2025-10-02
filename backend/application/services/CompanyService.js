import { request } from "express";
import initCompany from "../persistency/model/Company.js";
import CompanyRepository from "../persistency/repository/CompanyRepository.js";
import initOrganization from "../persistency/model/Organization.js";

class CompanyService {
    constructor(sequelize) {
        this.CompanyRepository = new CompanyRepository(initCompany(sequelize),initOrganization(sequelize),sequelize);

    }

    async createCompany(company_name,organizationid){ 
        try {
            await this.CompanyRepository.createCompany(company_name,organizationid);
        } catch (error) {
            console.error(`Error creating Company ${company_name}: ${error.message}`);
            throw error;
        }    
    }
}

export default CompanyService
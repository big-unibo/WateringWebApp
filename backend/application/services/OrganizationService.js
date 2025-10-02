import { request } from "express";
import initOrganization from "../persistency/model/Organization.js";
import OrganizationRepository from "../persistency/repository/OrganizationRepository.js";

class OrganizationService {
    constructor(sequelize) {
        this.organizationRepository = new OrganizationRepository(initOrganization(sequelize),sequelize);

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
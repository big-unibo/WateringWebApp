import { Op } from "sequelize"

class CompanyRepository {
    constructor(models, sequelize) {
        this.Company = models.Company
        this.Organization = models.Organization
        this.CompaniesOrganizations = models.CompaniesOrganizations
        this.Farm = models.Farm
        this.sequelize = sequelize
    }

    async createCompany(companyName, address, organizationIds) {
        try {
            for(const organizationId of organizationIds){
                const organization = await this.Organization.findByPk(organizationId);
                if (!organization) {
                    throw new Error(`Organization with ID ${organizationId} does not exist.`);
                }
            }

            const companyCreated = await this.Company.create({
                companyName,
                address
            });

            for(const organizationId of organizationIds){
                await this.CompaniesOrganizations.create({
                    companyId: companyCreated.id,
                    organizationId: organizationId
                })
            }

            return companyCreated;
        } catch (error) {
            throw new Error(`Error creating new company caused by: ${error.message}`);
        }
    }

    async getCompanyDetails(companyId) {
        try {
            const company = await this.Company.findByPk(companyId, {
                include: [{
                    model: this.CompaniesOrganizations,
                    as: 'organizations',
                    include: [
                        {
                            model: this.Organization,
                            as: 'organization'
                        }
                    ]
                },
                {
                    model: this.Farm,
                    as: 'farms',
                    required: false
                }],
            });
            return company;
        } catch (error) {
            throw new Error(`Error retrieving company details caused by: ${error.message}`);
        }
    }

    /**
     * Returns companies filtered by given ids, if filteringIds is not defined it returns all the companies, if it is empty return empty
     */
    async getCompanies(filteringIds) {
        try {
            const where = {};

            if (Array.isArray(filteringIds)) {
                if (filteringIds.length > 0){
                    where.id = {
                        [Op.in]: filteringIds
                    }
                } else {
                    return []
                }
            }

            const companies = await this.Company.findAll({ where });
            return companies;
        } catch (error) {
            throw new Error(`Error retrieving companies caused by: ${error.message}`);
        }
    }
}

export default CompanyRepository
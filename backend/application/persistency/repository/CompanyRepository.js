class CompanyRepository {
    constructor(models, sequelize) {
        this.Company = models.Company;
        this.Organization = models.Organization;
        this.sequelize = sequelize;
    }

    async createCompany(company_name, organization_id) {
        try {
            const organization = await this.Organization.findByPk(organization_id);
            if (!organization) {
            throw new Error(`Organization with ID ${organization_id} does not exist.`);
            }

            const companyCreated = await this.Company.create({
            company_name,
            organization_id
            });

            return companyCreated;
        } catch (error) {
            throw new Error(`Error creating new company caused by: ${error.message}`);
        }
    }
}

export default CompanyRepository
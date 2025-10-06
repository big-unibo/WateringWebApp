class CompanyRepository {
    constructor(models, sequelize) {
        this.Company = models.Company;
        this.Organization = models.Organization;
        this.sequelize = sequelize;
    }

    async createCompany(companyName, organizationId) {
        try {
            const organization = await this.Organization.findByPk(organizationId);
            if (!organization) {
            throw new Error(`Organization with ID ${organizationId} does not exist.`);
            }

            const companyCreated = await this.Company.create({
            companyName,
            organizationId
            });

            return companyCreated;
        } catch (error) {
            throw new Error(`Error creating new company caused by: ${error.message}`);
        }
    }
}

export default CompanyRepository
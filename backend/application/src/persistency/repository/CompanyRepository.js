class CompanyRepository {
    constructor(models, sequelize) {
        this.Company = models.Company;
        this.Organization = models.Organization;
        this.Field = models.Field;
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

    async getCompanyDetails(companyId) {
        try {
            const company = await this.Company.findByPk(companyId, {
                include: [{
                    model: this.Organization,
                    as: 'organization'
                },
                {
                    model: this.Field,
                    as: 'fields',
                    required: false
                }],
            });
            return company;
        } catch (error) {
            throw new Error(`Error retrieving company details caused by: ${error.message}`);
        }
    }

    async getCompanies() {
        try {
            const companies = await this.Company.findAll()
            return companies;
        } catch (error) {
            throw new Error(`Error retrieving companies caused by: ${error.message}`);
        }
    }
}

export default CompanyRepository
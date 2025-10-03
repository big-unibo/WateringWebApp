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

            const maxId = await this.Company.max('id') || 0;

            const companyCreated = this.Company.build({
                id: maxId + 1,
                company_name: company_name,
                organization_id: organization_id
            });

            return await companyCreated.save();
        } catch (error) {
            throw new Error(`Error creating new company caused by: ${error.message}`);
        }
    }
}

export default CompanyRepository
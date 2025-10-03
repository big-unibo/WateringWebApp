class CompanyRepository {
    constructor(Company, Organization, sequelize) {
        this.Company = Company;
        this.Organization = Organization;
        this.sequelize = sequelize;

        Company.belongsTo(Organization, { foreignKey: 'organizationid' });
    }

    async createCompany(company_name, organizationid) {
        try {
            const organization = await this.Organization.findByPk(organizationid);
            if (!organization) {
                throw new Error(`Organization with ID ${organizationid} does not exist.`);
            }

            const maxId = await this.Company.max('companyid') || 0;

            const companyCreated = this.Company.build({
                companyid: maxId + 1,
                company_name: company_name,
                organizationid: organizationid
            });

            return await companyCreated.save();
        } catch (error) {
            throw new Error(`Error creating new company caused by: ${error.message}`);
        }
    }
}

export default CompanyRepository
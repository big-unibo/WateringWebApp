class CompanyRepository {

    constructor(Company,Organization,sequelize) {
        this.Company = Company;
        this.Organization = Organization;

        Company.belongsTo(Organization, { foreignKey: 'organizationid' });
    }

    async createCompany(company_name,organizationid) {
        try{
            let companyCreated = this.Company.build({
                companyid: await this.Company.max('companyid') + 1,
                company_name: company_name,
                organizationid: organizationid
            })
            return await companyCreated.save();
        } catch (error){
            throw Error(`Error creating new company caused by: ${error.message}`)
        }
    }
}

export default CompanyRepository
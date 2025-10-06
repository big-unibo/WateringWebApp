class CompanyService {
    constructor(companyRepository) {
        this.companyRepository = companyRepository;
    }

    async createCompany(company){ 
        try {
            await this.companyRepository.createCompany(company.companyName,company.organizationid);
        } catch (error) {
            console.error(`Error creating Company ${company.companyName}: ${error.message}`);
            throw error;
        }    
    }
}

export default CompanyService
class CompanyService {
    constructor(companyRepository) {
        this.companyRepository = companyRepository;
    }

    async createCompany(company_name,organization_id){ 
        try {
            await this.companyRepository.createCompany(company_name,organization_id);
        } catch (error) {
            console.error(`Error creating Company ${company_name}: ${error.message}`);
            throw error;
        }    
    }
}

export default CompanyService
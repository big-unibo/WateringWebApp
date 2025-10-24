class CompanyService {
    constructor(companyRepository) {
        this.companyRepository = companyRepository;
    }

    async createCompany(company){ 
        try {
            const companyCreated = await this.companyRepository.createCompany(company.companyName,company.organizationId);
            return companyCreated.id;
        } catch (error) {
            console.error(`Error creating Company ${company.companyName}: ${error.message}`);
            throw error;
        }    
    }
}

export default CompanyService
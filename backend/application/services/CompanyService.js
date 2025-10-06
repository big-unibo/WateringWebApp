class CompanyService {
    constructor(companyRepository) {
        this.companyRepository = companyRepository;
    }

    async createCompany(request){ 
        try {
            await this.companyRepository.createCompany(request.companyName,organizationid);
        } catch (error) {
            console.error(`Error creating Company ${companyName}: ${error.message}`);
            throw error;
        }    
    }
}

export default CompanyService
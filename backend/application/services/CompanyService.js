class CompanyService {
    constructor(companyRepository) {
        this.companyRepository = companyRepository;
    }

    async createCompany(request){ 
        try {
            await this.companyRepository.createCompany(request.companyName,request.organizationid);
        } catch (error) {
            console.error(`Error creating Company ${request.companyName}: ${error.message}`);
            throw error;
        }    
    }
}

export default CompanyService
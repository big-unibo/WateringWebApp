export class CreateCompanyDto{
    /**
     * @param {string} companyName - Company name
     * @param {number} organizationId - Id of the organization associated with the company
     */
    constructor(
        companyName,
        organizationId,
    ) {
        this.companyName = companyName;
        this.organizationId = organizationId;
    }
}

export class CompanyDto{
    /**
     * @param {number} companyId - Id of the company
     * @param {string} companyName - Company name
     * @param {number} organizationId - Id of the organization associated with the company
     */
    constructor(
        companyId,
        companyName,
        organizationId,
    ) {
        this.companyId = companyId;
        this.companyName = companyName;
        this.organizationId = organizationId;
    }
}
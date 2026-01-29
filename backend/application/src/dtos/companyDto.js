export class Company {
    /**
     * @param {number} [companyId] - Id of the company (optional, e.g., for creation)
     * @param {string} companyName - Company name
     * @param {number} organizationId - Id of the organization associated with the company
     */
    constructor(
        companyName,
        organizationId,
        companyId = undefined
    ) {
        this.id = companyId;
        this.name = companyName;
        this.organizationId = organizationId;
    }
}

export class CompanyData {
    /**
     * @param {number} companyId - Id of the company
     * @param {string} companyName - Company name
     * @param {Organization} organization - Organization associated with the company
     * @param {Array<Fields>} fields - Array of fields associated with the company
     */
    constructor(companyId, companyName, organization, fields) {
        this.id = companyId
        this.name = companyName
        this.organization = organization
        this.fields = fields
    }
}


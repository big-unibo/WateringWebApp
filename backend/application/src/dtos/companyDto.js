export class Company {
    /**
     * @param {number} [companyId] - Id of the company (optional, e.g., for creation)
     * @param {string} companyName - Company name
     * @param {string} address - Address of the company
     * @param {number} [organizationIds] - Id of the organization associated with the company
     */
    constructor(
        companyName,
        address,
        organizationIds,
        companyId
    ) {
        this.id = companyId
        this.name = companyName
        this.address = address
        this.organizationIds = organizationIds
    }
}

export class CompanyData {
    /**
     * @param {number} companyId - Id of the company
     * @param {string} companyName - Company name
     * @param {string} address - Address of the company
     * @param {Array<Organization>} organizations - Array of organization associated with the company
     * @param {Array<Farm>} farms - Array of farms associated with the company
     */
    constructor(companyId, companyName, address, organizations, farms) {
        this.id = companyId
        this.name = companyName
        this.address = address
        this.organizations = organizations
        this.farms = farms
    }
}


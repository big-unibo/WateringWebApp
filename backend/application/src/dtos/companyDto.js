export class Company {
    /**
     * @param {string} companyName - Company name
     * @param {string} address - Address of the company
     * @param {number} [organizationIds] - Id of the organization associated with the company
     * @param {number} [companyId] - Id of the company (optional, e.g., for creation)
     * @param {number} [createdAt] - Timestamp of company creation (optional)
     * @param {number} [disabledAt] - Timestamp of company disablement (optional)
     */
    constructor(
        companyName,
        address,
        organizationIds,
        companyId,
        createdAt,
        disabledAt
    ) {
        this.id = companyId
        this.name = companyName
        this.address = address
        this.organizationIds = organizationIds
        this.createdAt = createdAt
        this.disabledAt = disabledAt
    }
}

export class CompanyData {
    /**
     * @param {number} companyId - Id of the company
     * @param {string} companyName - Company name
     * @param {string} address - Address of the company
     * @param {Array<Organization>} organizations - Array of organization associated with the company
     * @param {Array<Farm>} farms - Array of farms associated with the company
     * @param {number} createdAt - Timestamp of company creation
     * @param {number} disabledAt - Timestamp of company disablement
     */
    constructor(companyId, companyName, address, organizations, farms, createdAt, disabledAt) {
        this.id = companyId
        this.name = companyName
        this.address = address
        this.organizations = organizations
        this.farms = farms
        this.createdAt = createdAt
        this.disabledAt = disabledAt
    }
}


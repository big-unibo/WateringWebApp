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
        this.companyId = companyId;
        this.companyName = companyName;
        this.organizationId = organizationId;
    }
}

export class Company{
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
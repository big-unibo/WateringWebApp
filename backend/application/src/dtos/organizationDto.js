export class Organization{
    /**
     * @param {string} organizationName - Organization's name
     * @param {number} id - Organization's id
     */
    constructor(
        organizationName, id
    ) {
        this.organizationName = organizationName;
        this.id = id;
    }
}

export class OrganizationData{
    /**
     * @param {number} organizationId 
     * @param {string} organizationName 
     * @param {Array<Company>} companies 
     */
    constructor(organizationId, organizationName, companies){
        this.organizationId = organizationId;
        this.organizationName = organizationName;
        this.companies = companies;
    }
}
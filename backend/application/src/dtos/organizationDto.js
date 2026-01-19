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
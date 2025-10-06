export class Field{
    /**
     * @param {string} fieldName - Field's name
     * @param {number} companyId - Id of the company owning the field
     * @param {Location} Location - Location of the field
     */
    constructor(
        fieldName,
        companyId,
        location
    ) {
        this.fieldName = fieldName;
        this.companyId = companyId;
        this.location = location
    }
}
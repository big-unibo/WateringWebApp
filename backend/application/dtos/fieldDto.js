export class Field{
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


export class FieldData{
    constructor(
        fieldId,
        fieldName,
        location,
        organization,
        company,
        sectors
    ) {
        this.fieldId = fieldId
        this.fieldName = fieldName
        this.location = location
        this.organization = organization
        this.company = company,
        this.sectors = sectors
    }
}
export class Field{
    constructor(
        fieldName,
        companyId,
        location,
        fieldId,
    ) {
        this.id = fieldId;
        this.name = fieldName;
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
        this.id = fieldId
        this.name = fieldName
        this.location = location
        this.organization = organization
        this.company = company,
        this.sectors = sectors
    }
}
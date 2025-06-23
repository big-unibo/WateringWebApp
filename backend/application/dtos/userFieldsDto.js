export class UserField {

    constructor(refStructureName, companyName, fields) {
        this.refStructureName=refStructureName;
        this.companyName=companyName;
        this.fields=fields;
    }

}

export class UserFieldsDto {

    constructor(fieldList) {
        this.fieldList=fieldList;
    }

}
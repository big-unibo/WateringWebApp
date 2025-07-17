export class UserField {

    constructor(source, refStructureName, companyName, fields) {
        this.source = source;
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
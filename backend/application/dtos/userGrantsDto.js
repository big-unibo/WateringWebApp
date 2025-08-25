
export class UserGrantsDto {

  constructor(grants) {
    this.grants = grants
  }

}

export class UserGrantDto {

  constructor(refStructureName, companyName, fieldName, sectorName, thesisName, permits, userId) {
    this.refStructureName = refStructureName;
    this.companyName = companyName;
    this.fieldName = fieldName;
    this.sectorName = sectorName;
    this.thesisName = thesisName;
    this.permits = permits;
    this.userId = userId;
  }

}
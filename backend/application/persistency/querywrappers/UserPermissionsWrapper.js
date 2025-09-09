export class UserFieldPermissions {

  constructor(user, affiliation, role, permissions) {
    this.user = user
    this.affiliation = affiliation
    this.role = role
    this.permissions = permissions
  }

}

export class UserFieldPermission {

  constructor(source, refStructureName, companyName, fieldName, sectorName, thesisName, colture, coltureType, permissions) {
    this.source = source
    this.refStructureName = refStructureName
    this.companyName = companyName
    this.fieldName = fieldName
    this.sectorName = sectorName
    this.thesisName = thesisName
    this.colture = colture
    this.coltureType = coltureType
    this.permissions = permissions
  }

}
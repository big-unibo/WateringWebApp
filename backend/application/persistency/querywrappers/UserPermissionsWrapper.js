export class UserFieldPermissions {

  constructor(user, affiliation, role, permissions) {
    this.user = user
    this.affiliation = affiliation
    this.role = role
    this.permissions = permissions
  }

}

export class UserFieldPermission {

  constructor(refStructureName, companyName, fieldName, sectorName, plantRow, colture, coltureType, permissions) {
    this.refStructureName = refStructureName
    this.companyName = companyName
    this.fieldName = fieldName
    this.sectorName = sectorName
    this.plantRow = plantRow
    this.colture = colture
    this.coltureType = coltureType
    this.permissions = permissions
  }

}
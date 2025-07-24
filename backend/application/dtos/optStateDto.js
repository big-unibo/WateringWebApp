export class OptStateDto {

  constructor(refStructureName, companyName, fieldName, sectorName, plantRow, validFrom, validTo, matrixId, optimalState) {
    this.refStructureName = refStructureName
    this.companyName = companyName
    this.fieldName = fieldName
    this.sectorName = sectorName
    this.plantRow = plantRow
    this.validFrom = validFrom
    this.validTo = validTo,
    this.matrixId = matrixId,
    this.optimalState = optimalState
  }

}

export class MatrixData {

  constructor(xx, yy, zz, value, weight) {
    this.xx = xx
    this.yy = yy
    this.zz = zz
    this.optValue = value
    this.weight = weight
  }
}

export class MatrixDistanceData {

  constructor(xx, yy, zz, value, weight) {
    this.xx = xx
    this.yy = yy
    this.zz = zz
    this.value = value
    this.weight = weight
  }

}

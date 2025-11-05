export class OptStateDto {

  constructor(refStructureName, companyName, fieldName, sectorName, thesisName, validFrom, validTo, matrixId, optimalState) {
    this.refStructureName = refStructureName
    this.companyName = companyName
    this.fieldName = fieldName
    this.sectorName = sectorName
    this.thesisName = thesisName
    this.validFrom = validFrom
    this.validTo = validTo,
    this.matrixId = matrixId,
    this.optimalState = optimalState
  }

}

export class OptimalProfileData {
  constructor(x, y, z, value, weight) {
    this.x = x
    this.y = y
    this.z = z
    this.value = value
    this.weight = weight
  }
}

export class DistanceProfile {
  constructor(thesisName, timestamp, image){
    this.thesisName = thesisName
    this.timestamp = timestamp
    this.image = image
  }
}

export class OptimalStateData {

  constructor(thesisName, gridId, binningId, validFrom, validTo, stopPercentage, optimalLowerBound, optimalUpperBound, optimalProfiles) {
    this.thesisName = thesisName
    this.gridId = gridId,
      this.binningId = binningId,
      this.validFrom = validFrom
    this.validTo = validTo,
      this.stopPercentage = stopPercentage,
      this.optimalLowerBound = optimalLowerBound,
      this.optimalUpperBound = optimalUpperBound,
      this.optimalProfile = optimalProfiles
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
  constructor(thesisName, timestamp, image) {
    this.thesisName = thesisName
    this.timestamp = timestamp
    this.image = image
  }
}

export class DeltaData {
  constructor(value, timestamp) {
    this.value = value,
      this.timestamp = timestamp
  }
}

export class DeltaValueTypeData {
  constructor(thesisName, deviceId, unit, detectedValueTypeDescription, values) {
    this.thesisName = thesisName,
      this.deviceId = deviceId,
      this.unit = unit,
      this.detectedValueTypeDescription = detectedValueTypeDescription,
      this.values = values
  }
}



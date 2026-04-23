export class OptimalStateData {

  constructor(thesisName, optimalProfileId, binningId, validFrom, validTo, stopThreshold, optimalDryBound, optimalWetBound, optimalProfiles) {
    this.thesisName = thesisName
    this.optimalProfileId = optimalProfileId,
    this.binningId = binningId,
    this.validFrom = validFrom
    this.validTo = validTo,
    this.stopThreshold = stopThreshold,
    this.optimalDryBound = optimalDryBound,
    this.optimalWetBound = optimalWetBound,
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

export class DistanceValue {
  constructor(value, timestamp) {
    this.value = value,
    this.timestamp = timestamp
  }
}

export class OptimalDistanceData {
  constructor(thesisName, deviceId, unit, valueType, values) {
    this.thesisName = thesisName,
      this.deviceId = deviceId,
      this.unit = unit,
      this.valueType = valueType,
      this.values = values
  }
}


export class GridOptimalProfiles{

  constructor(gridId, validFrom, validTo, stopThreshold, optimalDryBound, optimalWetBound, optimalState) {
    this.gridId = gridId,
    this.validFrom = validFrom,
    this.validTo = validTo,
    this.stopThreshold = stopThreshold,
    this.optimalDryBound = optimalDryBound,
    this.optimalWetBound = optimalWetBound,
    this.optimalState = optimalState
  }
}


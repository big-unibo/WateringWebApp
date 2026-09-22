export class OptimalStateData {
  thesisName: string
  optimalProfileId: number
  binningId?: number | null
  validFrom?: number | null
  validTo?: number | null
  stopThreshold?: number | null
  optimalDryBound?: number | null
  optimalWetBound?: number | null
  optimalTolerance?: number | null
  optimalProfile: OptimalProfileData[]

  constructor(thesisName: string, optimalProfileId: number, binningId: number | null | undefined, validFrom: number | null | undefined, validTo: number | null | undefined, stopThreshold: number | null | undefined, optimalDryBound: number | null | undefined, optimalWetBound: number | null | undefined, optimalTolerance: number | null | undefined, optimalProfiles: OptimalProfileData[]) {
    this.thesisName = thesisName
    this.optimalProfileId = optimalProfileId
    this.binningId = binningId
    this.validFrom = validFrom
    this.validTo = validTo
    this.stopThreshold = stopThreshold
    this.optimalDryBound = optimalDryBound
    this.optimalWetBound = optimalWetBound
    this.optimalTolerance = optimalTolerance
    this.optimalProfile = optimalProfiles
  }
}

export class OptimalProfileData {
  x: number
  y: number
  z: number
  value: number | null
  weight?: number | null

  constructor(x: number, y: number, z: number, value: number | null, weight?: number | null) {
    this.x = x
    this.y = y
    this.z = z
    this.value = value
    this.weight = weight
  }
}

export class DistanceProfile {
  thesisName: string
  timestamp: number
  image: OptimalProfileData[]

  constructor(thesisName: string, timestamp: number, image: OptimalProfileData[]) {
    this.thesisName = thesisName
    this.timestamp = timestamp
    this.image = image
  }
}

export class DistanceValue {
  value: number | null
  timestamp: number

  constructor(value: number | null, timestamp: number) {
    this.value = value
    this.timestamp = timestamp
  }
}

export class OptimalDistanceData {
  thesisName: string
  deviceId: number
  unit?: string | null
  valueType?: string | null
  values: DistanceValue[]

  constructor(thesisName: string, deviceId: number, unit: string | null | undefined, valueType: string | null | undefined, values: DistanceValue[]) {
    this.thesisName = thesisName
    this.deviceId = deviceId
    this.unit = unit
    this.valueType = valueType
    this.values = values
  }
}

export class GridOptimalProfile {
  gridId: number
  validFrom?: number | null
  validTo?: number | null
  stopThreshold?: number | null
  optimalDryBound?: number | null
  optimalWetBound?: number | null
  optimalTolerance?: number | null
  optimalProfile: OptimalProfileData[]

  constructor(gridId: number, validFrom: number | null | undefined, validTo: number | null | undefined, stopThreshold: number | null | undefined, optimalDryBound: number | null | undefined, optimalWetBound: number | null | undefined, optimalTolerance: number | null | undefined, optimalProfile: OptimalProfileData[]) {
    this.gridId = gridId
    this.validFrom = validFrom
    this.validTo = validTo
    this.stopThreshold = stopThreshold
    this.optimalDryBound = optimalDryBound
    this.optimalWetBound = optimalWetBound
    this.optimalTolerance = optimalTolerance
    this.optimalProfile = optimalProfile
  }
}

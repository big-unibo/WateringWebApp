export class InterpolatedDataResponse {
  thesisName: string
  deviceId: number
  binningId?: number | null
  images: InterpolatedImageData[]

  constructor(thesisName: string, deviceId: number, binningId: number | null | undefined, images: InterpolatedImageData[]) {
    this.thesisName = thesisName
    this.deviceId = deviceId
    this.binningId = binningId
    this.images = images
  }
}

export class InterpolatedImageData {
  timestamp: number
  image: InterpolatedMeasureData[]

  constructor(timestamp: number, image: InterpolatedMeasureData[]) {
    this.timestamp = timestamp
    this.image = image
  }
}

export class InterpolatedMeasureData {
  x: number
  y: number
  z: number
  value: number | null

  constructor(x: number, y: number, z: number, value: number | null) {
    this.x = x
    this.y = y
    this.z = z
    this.value = value
  }
}

export class HumidityBin {
  humidityBin: string | number
  humidityBinDescription?: string | null
  lowerBound?: number | null
  upperBound?: number | null

  constructor(humidityBin: string | number, humidityBinDescription?: string | null, lowerBound?: number | null, upperBound?: number | null) {
    this.humidityBin = humidityBin
    this.humidityBinDescription = humidityBinDescription
    this.lowerBound = lowerBound
    this.upperBound = upperBound
  }
}

export class BinningInfo {
  id: number
  description?: string | null
  bins: HumidityBin[]

  constructor(binningId: number, binningDescription: string | null | undefined, bins: HumidityBin[]) {
    this.id = binningId
    this.description = binningDescription
    this.bins = bins
  }
}

export class HumidityBinsDataResponse {
  thesisName: string
  deviceId: number
  measures: HumidityBinMeasureData[]

  constructor(thesisName: string, deviceId: number, measures: HumidityBinMeasureData[]) {
    this.thesisName = thesisName
    this.deviceId = deviceId
    this.measures = measures
  }
}

export class HumidityBinMeasureData {
  humidityBin: string | number
  humidityBinDescription?: string | null
  timestamp: number
  count: number

  constructor(humidityBin: string | number, humidityBinDescription: string | null | undefined, timestamp: number, count: number) {
    this.humidityBin = humidityBin
    this.humidityBinDescription = humidityBinDescription
    this.timestamp = timestamp
    this.count = count
  }
}

export class InterpolatedMeanMeasureData {
  x: number
  y: number
  z: number
  std: number | null
  mean: number | null

  constructor(x: number, y: number, z: number, std: number | null, mean: number | null) {
    this.x = x
    this.y = y
    this.z = z
    this.std = std
    this.mean = mean
  }
}

export class InterpolatedMeansData {
  thesisName: string
  deviceId: number
  binningId?: number | null
  measures: InterpolatedMeanMeasureData[]

  constructor(thesisName: string, deviceId: number, binningId: number | null | undefined, measures: InterpolatedMeanMeasureData[]) {
    this.thesisName = thesisName
    this.deviceId = deviceId
    this.binningId = binningId
    this.measures = measures
  }
}

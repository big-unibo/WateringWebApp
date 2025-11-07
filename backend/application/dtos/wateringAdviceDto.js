
export class WateringAdviceDto {

  constructor(thesisName, advice, duration, imageTimestamp, wateringStart, r, lastIrrigation, baselineFlag) {

    this.thesisName = thesisName
    this.advice = advice
    this.duration = duration
    this.imageTimestamp = imageTimestamp
    this.wateringStart = wateringStart
    this.r = r
    this.lastIrrigation = lastIrrigation
    this.baselineFlag = baselineFlag
  }
}

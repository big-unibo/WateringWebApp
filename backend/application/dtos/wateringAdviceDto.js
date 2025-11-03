
export class WateringAdviceDto {

  constructor(thesisName, advice, duration, profileTimestamp, wateringStart, r, lastIrrigation, baselineFlag) {

    this.thesisName = thesisName
    this.advice = advice
    this.duration = duration
    this.profileTimestamp = profileTimestamp
    this.wateringStart = wateringStart
    this.r = r
    this.lastIrrigation = lastIrrigation
    this.baselineFlag = baselineFlag
  }
}


export class WateringAdvice {

  constructor(thesisName, advice, duration, imageTimestamp, wateringStart, r, lastWatering, baselineFlag) {

    this.thesisName = thesisName
    this.advice = advice
    this.duration = duration
    this.imageTimestamp = imageTimestamp
    this.wateringStart = wateringStart
    this.r = r
    this.lastWatering = lastWatering
    this.baselineFlag = baselineFlag
  }
}

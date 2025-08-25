
export class WateringAdviceDto {

  constructor(refStructureName, companyName, fieldName, sectorName, thesisName, advice, computedOn, duration, wateringStart, wateringEnd, r, ki, kp, lastIrrigation, baselineFlag) {
    this.refStructureName = refStructureName;
    this.companyName = companyName;
    this.fieldName = fieldName;
    this.sectorName = sectorName;
    this.thesisName = thesisName;
    this.advice = advice;
    this.computedOn = computedOn;
    this.duration = duration;
    this.wateringStart = wateringStart;
    this.wateringEnd = wateringEnd;
    this.r = r;
    this.ki = ki;
    this.kp = kp;
    this.lastIrrigation = lastIrrigation;
    this.baselineFlag = baselineFlag;
  }
}


export class WateringAdviceDto {

  constructor(refStructureName, companyName, fieldName, sectorName, plantRow, advice, computedOn, duration, wateringStart, wateringEnd, r, ki, kp, lastIrrigation) {
    this.refStructureName = refStructureName;
    this.companyName = companyName;
    this.fieldName = fieldName;
    this.sectorName = sectorName;
    this.plantRow = plantRow;
    this.advice = advice;
    this.computedOn = computedOn;
    this.duration = duration;
    this.wateringStart = wateringStart;
    this.wateringEnd = wateringEnd;
    this.r = r;
    this.ki = ki;
    this.kp = kp;
    this.lastIrrigation = lastIrrigation;  
  }
}


export class WateringAdviceDto {

  constructor(refStructureName, companyName, fieldName, sectorName, plantRow, advice, computedOn, wateringStart, wateringEnd) {
    this.refStructureName = refStructureName;
    this.companyName = companyName;
    this.fieldName = fieldName;
    this.sectorName = sectorName;
    this.plantRow = plantRow;
    this.advice = advice;
    this.computedOn = computedOn;
    this.wateringStart = wateringStart;
    this.wateringEnd = wateringEnd;
  }
}

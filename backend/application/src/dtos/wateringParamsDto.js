export class WateringParams {
  constructor(
    maxWatering,
    minWatering,
    wateringBaseline,
    wateringFrequency,
    ki,
    kp,
    errorFunction,
    description
  ) {
    this.maxWatering = maxWatering;
    this.minWatering = minWatering;
    this.wateringBaseline = wateringBaseline;
    this.wateringFrequency = wateringFrequency;
    this.ki = ki;
    this.kp = kp;
    this.errorFunction = errorFunction;
    this.description = description;
  }
}

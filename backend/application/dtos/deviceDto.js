export class CreateSignalDto {
    constructor({typeId, description, x, y, z, virtual, unit }) {
        this.typeId = typeId;
        this.description = description;
        this.x = x;
        this.y = y;
        this.z = z;
        this.virtual = virtual;
        this.unit = unit;
    }
}

export class CreateDeviceDto {
    constructor( {type, providerId, description, location, signals = [] }) {
        this.type = type;
        this.providerId = providerId;
        this.description = description;
        this.location = location;
        this.signals = signals.map(sig => new CreateSignalDto(sig));
    }
}
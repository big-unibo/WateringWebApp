import { HumidityBinMeasureData, HumidityBinsDataResponse, InterpolatedDataResponse, InterpolatedImageData, InterpolatedMeanMeasureData, InterpolatedMeansData, InterpolatedMeasureData, HumidityBin, BinningInfo } from "../dtos/interpolatedDataDto.js";
import { Organization, OrganizationData } from "../dtos/organizationDto.js";
import { Company, CompanyData } from "../dtos/companyDto.js";
import { SignalData, MeasureData, SignalTypeData } from '../dtos/dataDto.js';
import { WateringScheduleResponse, WateringEventData, ThesisContributionData } from "../dtos/wateringScheduleDto.js";
import { DistanceValue, OptimalDistanceData, DistanceProfile, OptimalProfileData, OptimalStateData } from "../dtos/optStateDto.js";
import { WateringAdvice } from "../dtos/wateringAdviceDto.js";
import { SectorCompact, SectorData, SectorService, Service } from "../dtos/sectorDto.js";
import { Device, DeviceTargetType } from "../dtos/deviceDto.js";
import { Signal, SignalInfo, SignalInfoArgs, SignalType } from "../dtos/signalDto.js";
import { EntityRef, ThesisData } from "../dtos/thesisDto.js";
import { WateringParams } from "../dtos/wateringParamsDto.js";
import { Farm, FarmData } from "../dtos/farmDto.js";
import { User } from "../dtos/userDto.js";
import { UserResourcePermit } from "../dtos/userPermitsDto.js";
import { OrganizationModel } from "../persistency/model/OrganizationModel.js";
import { CompanyModel } from "../persistency/model/CompanyModel.js";
import { SectorResult } from "../persistency/repository/SectorRepository.js";
import { SectorModel } from "../persistency/model/SectorModel.js";
import { FarmModel } from "../persistency/model/FarmModel.js";
import { ThesisInSectorModel } from "../persistency/model/ThesisInSectorModel.js";
import { ThesisModel } from "../persistency/model/ThesisModel.js";
import { FarmDetails } from "../persistency/repository/FarmRepository.js";
import { OptimalStateResult, ThesisDetailsResult } from "../persistency/repository/ThesisRepository.js";
import { MeasurementByThesisResult } from "../persistency/repository/ThesesAllSignalsRepository.js";
import { InterpolatedMeanResult, InterpolatedProfileResult } from "../persistency/repository/InterpolatedProfileRepository.js";
import { BinningInfoResult, HumidityBinsResult } from "../persistency/repository/HumidityBinsRepository.js";
import { DeviceAssociationResult, DeviceResult } from "../persistency/repository/DeviceRepository.js";
import { SignalInfoResult, SignalResult } from "../persistency/repository/SignalRepository.js";
import { SignalTypeModel } from "../persistency/model/SignalTypeModel.js";
import { WateringScheduleRow } from "../persistency/repository/WateringScheduleRepository.js";
import { WateringAlgorithmParamsModel } from "../persistency/model/WateringAlgorithmParamsModel.js";
import { AdviceModel } from "../persistency/model/AdviceModel.js";
import { OptimalDistanceResult, PunctualDistanceResult } from "../persistency/repository/OptimalDistanceRepository.js";
import { ServiceModel } from "../persistency/model/ServiceModel.js";
import { SectorServicesModel } from "../persistency/model/SectorServicesModel.js";
import { UserModel } from "../persistency/model/UserModel.js";
import { PermitModel } from "../persistency/model/PermitModel.js";
import { UserRoles } from "../persistency/repository/AuthorizationRepository.js";

class DtoConverter {

    convertOrganizationsDataWrapper(organizationsData: OrganizationModel[]): Organization[] {
        if (!Array.isArray(organizationsData)) return []
        return organizationsData.map(o => new Organization(o.organizationName, o.id))
    }

    convertCompanies(companiesData: CompanyModel[]): Company[] {
        return companiesData.map(c => this.convertCompany(c))
    }

    convertCompany(company: CompanyModel): Company {
        return new Company(
            company.companyName,
            company.address,
            undefined,
            company.id,
            company.createdAt,
            company.disabledAt
        );
    }

    convertSectorsDataWrapper(sectorsData: SectorResult[]): SectorCompact[] {
        if (!Array.isArray(sectorsData)) return [];

        return sectorsData.map(s => new SectorCompact(
            s.sectorId,
            s.sectorName,
            s.culture,
            s.cultureType,
            s.location,
            {
                id: s.farmId,
                name: s.farmName
            },
            {
                id: s.companyId,
                name: s.companyName
            },
            s.createdAt,
            s.disabledAt
        ));
    }



    convertSectorDataWrapper(sectorData: SectorModel & { farm: FarmModel & { company: CompanyModel }, thesisInSector: (ThesisInSectorModel & { thesis: ThesisModel })[] }) {
        const theses = sectorData.thesisInSector?.map(t => ({
            id: t.thesisId,
            name: t.thesis?.thesisName,
            weight: t.weight,
            validFrom: t.validFrom,
            validTo: t.validTo,
        })) || [];

        const company = {
            id: sectorData.farm.companyId,
            name: sectorData.farm.company.companyName
        };

        const farm = {
            id: sectorData.farmId,
            name: sectorData.farm.farmName,
            location: sectorData.farm.location
        };


        return new SectorData(
            sectorData.id,
            sectorData.sectorName,
            sectorData.culture,
            sectorData.cultureType,
            sectorData.location,
            sectorData.dripperCapacity,
            sectorData.sprinklerCapacity,
            sectorData.doubleWing,
            farm,
            company,
            theses,
            sectorData.createdAt,
            sectorData.disabledAt
        );
    }

    convertFarms(farmsData: FarmModel[]): Farm[] {
        return farmsData.map(farm => new Farm(farm.farmName, farm.companyId, farm.location, farm.id, farm.createdAt, farm.disabledAt))
    }

    convertFarmDataWrapper(farmData: FarmDetails): FarmData {

        const company = {
            id: farmData.companyId,
            name: farmData.companyName
        };

        const sectors = (farmData.sectors || []).map(sector => ({
            id: sector.id,
            name: sector.sectorName,
            createdAt: sector.createdAt,
            disabledAt: sector.disabledAt
        }));

        return new FarmData(
            farmData.id,
            farmData.farmName,
            farmData.location,
            company,
            sectors,
            farmData.createdAt,
            farmData.disabledAt
        );
    }

    convertThesisDataWrapper(thesisData: ThesisDetailsResult): ThesisData {
        const company = {
            id: thesisData.sector.farm.company.id,
            name: thesisData.sector.farm.company.companyName
        };

        const farm = {
            id: thesisData.sector.farm.id,
            name: thesisData.sector.farm.farmName,
            location: thesisData.sector.farm.location
        };

        const sector = {
            id: thesisData.sector.id,
            name: thesisData.sector.sectorName,
            culture: thesisData.sector.culture,
            cultureType: thesisData.sector.cultureType,
            location: thesisData.sector.location,
            dripperCapacity: thesisData.sector.dripperCapacity,
            sprinklerCapacity: thesisData.sector.sprinklerCapacity,
            doubleWing: thesisData.sector.doubleWing,
        };


        return new ThesisData(
            thesisData.thesisId,
            thesisData.thesis.thesisName,
            thesisData.validFrom,
            thesisData.validTo,
            thesisData.weight,
            company,
            farm,
            sector
        );
    }

    convertMeasurementsDataWrapper(wrappers: MeasurementByThesisResult[]): SignalTypeData[] {
        type GroupedSignalType = {
            thesisName: string;
            signalType: string;
            signalTypeDescription: string;
            signals: Record<string, {
                signalId: number;
                deviceId: number | null;
                signalDescription: string | null;
                sensorTechnology: string | null;
                x: number | null;
                y: number | null;
                z: number | null;
                virtual: boolean | null;
                unit: string | null;
                values: MeasurementByThesisResult[];
            }>;
        };

        const grouped = wrappers.reduce<Record<string, GroupedSignalType>>((acc, curr) => {
            const typeKey = `${curr.thesisName}_${curr.signalType}_${curr.signalTypeDescription}`;
            if (!acc[typeKey]) {
                acc[typeKey] = {
                    thesisName: curr.thesisName,
                    signalType: curr.signalType,
                    signalTypeDescription: curr.signalTypeDescription,
                    signals: {}
                };
            }

            const signalKey = `${curr.signalId}_${curr.signalDescription}`;
            if (!acc[typeKey].signals[signalKey]) {
                acc[typeKey].signals[signalKey] = {
                    signalId: curr.signalId,
                    deviceId: curr.deviceId,
                    signalDescription: curr.signalDescription,
                    sensorTechnology: curr.sensorTechnology,
                    x: curr.x,
                    y: curr.y,
                    z: curr.z,
                    virtual: curr.virtual,
                    unit: curr.unit,
                    values: []
                };
            }

            acc[typeKey].signals[signalKey].values.push(curr);

            return acc;
        }, {});

        const signalTypeDataArray = Object.values(grouped).map(typeGroup => {
            const signals = Object.values(typeGroup.signals).map(signalGroup => {
                const measurements = (signalGroup.values ?? [])
                    .filter(v => v != null && v.timestamp != null && v.value != null)
                    .map(v => new MeasureData(v.timestamp, v.value, v.computed));
                return new SignalData({
                    ...signalGroup,
                    measurements: measurements
                });
            });

            return new SignalTypeData(
                typeGroup.signalType,
                typeGroup.signalTypeDescription,
                signals,
                typeGroup.thesisName
            );
        });

        return signalTypeDataArray;
    }

    convertHeatmapDataWrapper(wrappers: InterpolatedProfileResult[]): InterpolatedDataResponse | null {
        if (!wrappers || wrappers.length === 0) {
            return null;
        }
        const { thesisName, deviceId, binningId } = wrappers[0];

        const validRows = wrappers.filter(w => w.timestamp != null);

        const imagesMap: Record<number, { timestamp: number; measures: InterpolatedMeasureData[] }> = validRows.reduce((acc, curr) => {
            const key = curr.timestamp;

            if (!acc[key]) {
                acc[key] = {
                    timestamp: curr.timestamp,
                    measures: []
                };
            }

            acc[key].measures.push(
                new InterpolatedMeasureData(curr.x, curr.y, curr.z, curr.value)
            );

            return acc;
        }, {});

        const images = Object.values(imagesMap).map(
            img => new InterpolatedImageData(img.timestamp, img.measures)
        );

        return new InterpolatedDataResponse(thesisName, deviceId, binningId, images);
    }


    convertHumidityBinsDataWrapper(wrappers: HumidityBinsResult[]): HumidityBinsDataResponse | null {
        if (!wrappers || wrappers.length === 0) {
            return null;
        }

        const { thesisName, deviceId } = wrappers[0];
        const validRows = wrappers.filter(w => w.timestamp != null);

        const measures = validRows.map(curr =>
            new HumidityBinMeasureData(
                curr.humidityBin,
                curr.humidityBinDescription,
                curr.timestamp,
                curr.count
            )
        );

        return new HumidityBinsDataResponse(thesisName, deviceId, measures);
    };

    convertDevicesDataWrapper(devicesData: DeviceResult[]): Device[] {
        const grouped: Record<string, any> = devicesData.reduce((acc, curr) => {
            const deviceKey = `${curr.deviceId}`;
            if (!acc[deviceKey]) {
                acc[deviceKey] = {
                    deviceId: curr.deviceId,
                    deviceType: curr.deviceType,
                    deviceDescription: curr.deviceDescription,
                    binningId: curr.binningId,
                    location: curr.location,
                    createdAt: curr.createdAt,
                    disabledAt: curr.disabledAt,
                    signals: {}
                };
            }

            const signalKey = `${curr.signalId}`;
            if (!acc[deviceKey].signals[signalKey]) {
                acc[deviceKey].signals[signalKey] = {
                    signalId: curr.signalId,
                    signalDescription: curr.signalDescription,
                    sensorTechnology: curr.sensorTechnology,
                    signalType: curr.signalType,
                    signalTypeDescription: curr.signalTypeDescription,
                    x: curr.x,
                    y: curr.y,
                    z: curr.z,
                    virtual: curr.virtual,
                    unit: curr.unit,
                    scalingFactor: !(curr.scalingFactor === 1 && curr.scaledUnit === null) ? curr.scalingFactor : null,
                    scaledUnit: curr.scaledUnit,
                    lastMeasurementTimestamp: curr.lastMeasurementTimestamp,
                    providerId: curr.providerId,
                    idOnProvider: curr.idOnProvider
                };
            }
            return acc;
        }, {});

        const devicesArray = Object.values(grouped).map(deviceGroup => {
            const signalsArray = this.convertSignalWrapper(Object.values(deviceGroup.signals))

            return new Device({
                deviceId: deviceGroup.deviceId,
                deviceType: deviceGroup.deviceType,
                deviceDescription: deviceGroup.deviceDescription,
                binningId: deviceGroup.binningId,
                location: deviceGroup.location,
                createdAt: deviceGroup.createdAt,
                disabledAt: deviceGroup.disabledAt,
                signals: signalsArray
            });
        });

        return devicesArray;
    }

    convertSignalInfoEntries(signalInfo: SignalInfoResult[]): SignalInfo[] {
        const signals: Record<number, SignalInfoArgs> = signalInfo.reduce((acc, curr) => {
            if (!acc[curr.signalId]) {
                acc[curr.signalId] = {
                    signalId: curr.signalId,
                    signalDescription: curr.signalDescription,
                    signalType: curr.signalType,
                    signalTypeDescription: curr.signalTypeDescription,
                    x: curr.x,
                    y: curr.y,
                    z: curr.z,
                    virtual: curr.virtual,
                    unit: curr.unit,
                    sensorTechnology: curr.sensorTechnology,
                    idOnProvider: curr.idOnProvider,
                    lastMeasurementTimestamp: curr.lastMeasurementTimestamp,
                    createdAt: curr.createdAt,
                    disabledAt: curr.disabledAt,
                    devices: []
                };
            }

            acc[curr.signalId].devices.push({ deviceId: curr.deviceId, deviceType: curr.deviceType, deviceDescription: curr.deviceDescription });

            return acc;
        }, {});

        return Object.values(signals).map(s => new SignalInfo(s));
    }

    convertSignalWrapper(signalWrappers: SignalResult[]): Signal[] {
        return signalWrappers.map(s => new Signal(s))
    }

    convertSignalsDataWrapper(wrappers: SignalResult[]): SignalTypeData[] {
        const grouped: Record<string, { signalType: string, signalTypeDescription: string, signals: SignalResult[] }> = wrappers.reduce((acc, curr) => {
            const typeKey = `${curr.signalType}_${curr.signalTypeDescription}`;
            if (!acc[typeKey]) {
                acc[typeKey] = {
                    signalType: curr.signalType,
                    signalTypeDescription: curr.signalTypeDescription,
                    signals: []
                };
            }

            acc[typeKey].signals.push(curr);

            return acc;
        }, {});


        const signalTypeDataArray = Object.values(grouped).map(typeGroup => {
            const signals = (typeGroup.signals ?? [])
                .map(s => new SignalData(s));

            return new SignalTypeData(
                typeGroup.signalType,
                typeGroup.signalTypeDescription,
                signals
            );
        });

        return signalTypeDataArray;
    }

    convertSignalTypes(signalTypes: SignalTypeModel[]): SignalType[] {
        return signalTypes.map(st => new SignalType(st));
    }

    convertAssociationsEntries(associations: DeviceAssociationResult[]): { theses: EntityRef[], sectors: EntityRef[], farms: EntityRef[] } {
        const theses = [
            ...new Map(
                associations
                    .filter(s => s.associationType.toUpperCase() === DeviceTargetType.THESIS)
                    .map(t => [t.thesisId, { id: t.thesisId, name: t.thesisName }])
            ).values()
        ]
        const sectors = [
            ...new Map(
                associations
                    .filter(s => s.associationType.toUpperCase() === DeviceTargetType.SECTOR)
                    .map(t => [t.sectorId, { id: t.sectorId, name: t.sectorName }])
            ).values()
        ]
        const farms = [
            ...new Map(
                associations
                    .filter(s => s.associationType.toUpperCase() === DeviceTargetType.FARM)
                    .map(t => [t.farmId, { id: t.farmId, name: t.farmName }])
            ).values()
        ]

        return { theses: theses, sectors: sectors, farms: farms }
    }

    convertCalendarWrapper(wrappers: WateringScheduleRow[]): WateringScheduleResponse[] {
        const groupedMap: Record<number, { sectorId: number, sectorName: string, events: any[] }> = wrappers.reduce((acc, curr) => {
            const sectorIdKey = curr.sectorId;

            if (!acc[sectorIdKey]) {
                acc[sectorIdKey] = {
                    sectorId: curr.sectorId,
                    sectorName: curr.sectorName,
                    events: []
                };
            }

            const sector = acc[sectorIdKey];
            let existingEvent = sector.events.find(event =>
                event.date === curr.date &&
                event.updateTimestamp === curr.updateTimestamp &&
                event.wateringStart === curr.wateringStart &&
                event.wateringEnd === curr.wateringEnd
            );

            if (!existingEvent) {
                existingEvent = {
                    eventId: curr.eventId,
                    date: curr.date,
                    updateTimestamp: curr.updateTimestamp,
                    wateringStart: curr.wateringStart,
                    wateringEnd: curr.wateringEnd,
                    advice: curr.advice,
                    duration: curr.duration,
                    expectedWater: curr.expectedWater,
                    note: curr.note,
                    updatedBy: curr.updatedBy,
                    enabled: curr.enabled ?? false,
                    scheduled: curr.scheduled ?? false,
                    theses: []
                };
                sector.events.push(existingEvent);
            }

            existingEvent.theses.push(new ThesisContributionData(
                curr.thesisId,
                curr.thesisName,
                curr.weight,
                curr.imageTimestamp
            ));

            return acc;
        }, {});

        const response = Object.values(groupedMap).map(sectorGroup => {
            const eventsData = sectorGroup.events.map(event => {
                return new WateringEventData(
                    event.eventId,
                    event.date,
                    event.wateringStart,
                    event.wateringEnd,
                    event.duration,
                    event.enabled,
                    event.scheduled,
                    event.advice,
                    event.expectedWater,
                    event.note,
                    event.updateTimestamp,
                    event.updatedBy,
                    event.theses
                );
            });
            return new WateringScheduleResponse(
                sectorGroup.sectorId,
                eventsData,
                sectorGroup.sectorName,
            );
        });

        return response
    }

    convertWateringAlgorithmParamsWrapper(results: WateringAlgorithmParamsModel): WateringParams {
        const {
            maxWatering,
            minWatering,
            wateringBaseline,
            wateringFrequency,
            ki,
            kp,
            errorFunction,
            description
        } = results
        return new WateringParams(maxWatering, minWatering, wateringBaseline, wateringFrequency, ki, kp, errorFunction, description)
    }

    convertOptimalStateWrapper(results: OptimalStateResult[]): OptimalStateData {
        const optimalProfile = results.map(v => new OptimalProfileData(v.x, v.y, v.z, v.value, v.weight))
        return new OptimalStateData(results[0].thesisName, results[0].optimalProfileId, results[0].binningId, results[0].validFrom, results[0].validTo, results[0].stopThreshold, results[0].optimalDryBound, results[0].optimalWetBound, results[0].optimalTolerance, optimalProfile)
    }

    convertWateringAdviceWrapper(adviceWrapper: AdviceModel & { thesisName: string }): WateringAdvice {
        return new WateringAdvice(adviceWrapper.thesisName, adviceWrapper.advice, adviceWrapper.duration, adviceWrapper.imageTimestamp,
            adviceWrapper.wateringStart, adviceWrapper.r, adviceWrapper.lastWatering);
    }

    convertPunctualDistanceWrapper(results: PunctualDistanceResult[]): DistanceProfile {
        const distances = results.map(v => new OptimalProfileData(v.x, v.y, v.z, v.distance, v.weight))
        return new DistanceProfile(results[0].thesisName, results[0].timestamp, distances, results[0].optimalDryBound, results[0].optimalWetBound)
    }

    convertOptimalDistanceWrapper(wrappers: OptimalDistanceResult[]): OptimalDistanceData[] {
        const grouped: Record<string, any> = wrappers.reduce((acc, curr) => {
            const typeKey = `${curr.thesisName}_${curr.deviceId}_${curr.valueType}`;
            if (!acc[typeKey]) {
                acc[typeKey] = {
                    thesisName: curr.thesisName,
                    deviceId: curr.deviceId,
                    unit: curr.unit,
                    valueType: curr.valueType,
                    values: []
                };
            }

            acc[typeKey].values.push(curr);

            return acc;
        }, {});


        const signalTypeDataArray = Object.values(grouped).map(typeGroup => {
            const values = (typeGroup.values ?? [])
                .map(s => new DistanceValue(
                    s.value,
                    s.timestamp
                ));

            return new OptimalDistanceData(
                typeGroup.thesisName,
                typeGroup.deviceId,
                typeGroup.unit,
                typeGroup.valueType,
                values
            );
        });

        return signalTypeDataArray;
    }

    convertInterpolatedMeansWrapper(results: InterpolatedMeanResult[]): InterpolatedMeansData | null {
        if (!results || results.length === 0) {
            return null;
        }

        const { thesisName, deviceId, binningId } = results[0];
        const validRows = results.filter(v => v.mean != null);

        const measures = validRows.map(v =>
            new InterpolatedMeanMeasureData(v.x, v.y, v.z, v.std, v.mean)
        );

        return new InterpolatedMeansData(thesisName, deviceId, binningId, measures);
    }

    convertServices(services: ServiceModel[]): Service[] {
        if (!Array.isArray(services)) return []
        return services.map(s => new Service(s.serviceName, s.id))
    }

    convertSectorServices(result: SectorServicesModel[]): SectorService[] {
        if (!Array.isArray(result)) return []
        return result.map(s => new SectorService(s.service.serviceName, s.service.id, s.validFrom, s.validTo))
    }

    convertBinningInfoWrapper(binningData: BinningInfoResult[]): BinningInfo[] {
        if (!Array.isArray(binningData)) return []
        const grouped: Record<number, { id: number; description: string; bins: HumidityBin[] }> = binningData.reduce((acc, curr) => {
            if (!acc[curr.binningId]) {
                acc[curr.binningId] = {
                    id: curr.binningId,
                    description: curr.binningDescription,
                    bins: []
                };
            }
            acc[curr.binningId].bins.push(new HumidityBin(curr.humidityBin, curr.humidityBinDescription, curr.lowerBound, curr.upperBound));
            return acc;
        }, {});


        const binnings = Object.values(grouped).map(b => {
            return new BinningInfo(b.id, b.description, b.bins);
        });
        return binnings;
    }

    convertUserData(userData: UserModel): User {
        return new User(userData.id, userData.email, userData.name)
    }

    convertUsersResourcePermits(usersData: PermitModel[]): UserResourcePermit[] {
        return usersData.map(u => new UserResourcePermit(new User(u.user.id, u.user.email, u.user.name), u.role?.toUpperCase(), u.extraAttributes))
    }

    convertUserRoles(users: UserRoles[]): { user: User, roles: string[] }[] {
        return users.map(u => ({ user: new User(u.id, u.email, u.name), roles: u.roles.map(r => r.toUpperCase()) }))
    }
}

export default DtoConverter;
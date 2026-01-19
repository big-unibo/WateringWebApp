import { HumidityBinMeasureData, HumidityBinsDataResponse, InterpolatedDataResponse, InterpolatedImageData, InterpolatedMeanMeasureData, InterpolatedMeansData, InterpolatedMeasureData } from "../dtos/interpolatedDataDto.js";
import { Organization, OrganizationData } from "../dtos/organizationDto.js";
import { Company, CompanyData } from "../dtos/companyDto.js";
import { SignalData, MeasureData, SignalTypeData } from '../dtos/dataDto.js';
import { WateringScheduleResponse, WateringEventData, ThesisContributionData } from "../dtos/wateringScheduleDto.js";
import { DistanceValue, OptimalDistanceData, DistanceProfile, OptimalProfileData, OptimalStateData } from "../dtos/optStateDto.js";
import { WateringAdvice } from "../dtos/wateringAdviceDto.js";
import { SectorCompact, SectorData } from "../dtos/sectorDto.js";
import { Device, DeviceTargetType } from "../dtos/deviceDto.js";
import { Signal, SignalInfo } from "../dtos/signalDto.js";
import { ThesisData, ThesisRef } from "../dtos/thesisDto.js";
import { WateringParams } from "../dtos/wateringParamsDto.js";
import { FieldData } from "../dtos/fieldDto.js";

class DtoConverter {

    convertOrganizationsDataWrapper(organizationsData) {
        if (!Array.isArray(organizationsData)) return []
        return organizationsData.map(o => new Organization(o.organizationName, o.id))
    }

    convertOrganizationDataWrapper(organizationData) {
        if (!organizationData) return null
        const companies = (organizationData.companies || []).map(company => ({
            id: company.id,
            name: company.companyName
        }))

        return new OrganizationData(
            organizationData.organizationName,
            organizationData.id,
            companies
        )
    }

    convertCompany(company) {
        return new Company(
            company.companyName,
            company.organizationId,
            company.id
        );
    }

    convertCompanyDataWrapper(companyData) {
        if (!companyData) return null;

        const organization = {
            id: companyData.organization.id,
            name: companyData.organization.organizationName
        };
        const fields = (companyData.fields || []).map(field => ({
            id: field.id,
            name: field.fieldName
        }));
        return new CompanyData(
            companyData.id,
            companyData.companyName,
            organization,
            fields
        );
    }

    convertSectorsDataWrapper(sectorsData) {
        if (!Array.isArray(sectorsData)) return [];

        return sectorsData.map(s => new SectorCompact(
            s.sectorId,
            s.sectorName,
            s.culture,
            s.cultureType,
            s.location,
            {
                id: s.fieldId,
                name: s.fieldName
            },
            {
                id: s.companyId,
                name: s.companyName
            },
            {
                id: s.organizationId,
                name: s.organizationName
            }
        ));
    }



    convertSectorDataWrapper(sectorData) {
        const theses = sectorData.thesisInSector?.map(t => ({
            id: t.thesisId,
            name: t.thesis?.thesisName
        })) || [];

        const uniqueTheses = Array.from(new Map(theses.map(t => [t.id, t])).values());
        const thesisDtos = uniqueTheses.map(t => new ThesisRef(t.id, t.name));

        const organization = {
            id: sectorData.field.company.organizationId,
            name: sectorData.field.company.organization.organizationName
        };

        const company = {
            id: sectorData.field.companyId,
            name: sectorData.field.company.companyName
        };

        const field = {
            id: sectorData.fieldId,
            name: sectorData.field.fieldName,
            location: sectorData.field.location
        };


        return new SectorData(
            sectorData.id,
            sectorData.sectorName,
            sectorData.culture,
            sectorData.cultureType,
            sectorData.location,
            sectorData.prescriptive,
            sectorData.advice,
            sectorData.dripperCapacity,
            sectorData.sprinklerCapacity,
            sectorData.doubleWing,
            field,
            company,
            organization,
            thesisDtos
        );
    }


    convertFieldDataWrapper(fieldData) {
        const organization = {
            id: fieldData.company.organization.id,
            name: fieldData.company.organization.organizationName
        };

        const company = {
            id: fieldData.company.id,
            name: fieldData.company.companyName
        };

        const sectors = (fieldData.sectors || []).map(sector => ({
            id: sector.id,
            name: sector.sectorName
        }));

        return new FieldData(
            fieldData.id,
            fieldData.fieldName,
            fieldData.location,
            organization,
            company,
            sectors
        );
    }

    convertThesisDataWrapper(thesisData) {
        const organization = {
            id: thesisData.sector.field.company.id,
            name: thesisData.sector.field.company.organization.organizationName
        };

        const company = {
            id: thesisData.sector.field.company.id,
            name: thesisData.sector.field.company.companyName
        };

        const field = {
            id: thesisData.sector.field.id,
            name: thesisData.sector.field.fieldName,
            location: thesisData.sector.field.location
        };

        const sector = {
            id: thesisData.sector.id,
            name: thesisData.sector.sectorName,
            culture: thesisData.sector.culture,
            cultureType: thesisData.sector.cultureType,
            location: thesisData.sector.location,
            prescriptive: thesisData.sector.prescriptive,
            advice: thesisData.sector.advice,
            dripperCapacity: thesisData.sector.dripperCapacity,
            sprinklerCapacity: thesisData.sector.sprinklerCapacity,
            doubleWing: thesisData.sector.doubleWing,
        };


        return new ThesisData(
            thesisData.thesisId,
            thesisData.thesisName,
            thesisData.validFrom,
            thesisData.validTo,
            thesisData.weight,
            organization,
            company,
            field,
            sector
        );
    }

    convertMeasurementsDataWrapper(wrappers) {
        const grouped = wrappers.reduce((acc, curr) => {
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

    convertHeatmapDataWrapper(wrappers) {
        if (!wrappers || wrappers.length === 0) {
            return null;
        }
        const { thesisName, deviceId, binningId } = wrappers[0];

        const validRows = wrappers.filter(w => w.timestamp != null);

        const imagesMap = validRows.reduce((acc, curr) => {
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


    convertHumidityBinsDataWrapper(wrappers) {
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

    convertDevicesDataWrapper(devicesData) {
        const grouped = devicesData.reduce((acc, curr) => {
            const deviceKey = `${curr.deviceId}`;
            if (!acc[deviceKey]) {
                acc[deviceKey] = {
                    deviceId: curr.deviceId,
                    deviceType: curr.deviceType,
                    deviceDescription: curr.deviceDescription,
                    signals: {}
                };
            }

            const signalKey = `${curr.signalId}`;
            if (!acc[deviceKey].signals[signalKey]) {
                acc[deviceKey].signals[signalKey] = {
                    signalId: curr.signalId,
                    deviceId: curr.deviceId,
                    signalDescription: curr.signalDescription,
                    signalType: curr.signalType,
                    signalTypeDescription: curr.signalTypeDescription,
                    x: curr.x,
                    y: curr.y,
                    z: curr.z,
                    virtual: curr.virtual,
                    unit: curr.unit,
                    lastMeasurementTimestamp: curr.lastMeasurementTimestamp,
                    providerId: curr.providerId,
                    idOnProvider: curr.idOnProvider
                };
            }
            return acc;
        }, {});

        const devicesArray = Object.values(grouped).map(deviceGroup => {
            const signalsArray = Object.values(deviceGroup.signals).map(signalGroup => {
                return new Signal(signalGroup);
            });

            return new Device({
                deviceId: deviceGroup.deviceId,
                deviceType: deviceGroup.deviceType,
                deviceDescription: deviceGroup.deviceDescription,
                signals: signalsArray
            });
        });

        return devicesArray;
    }

    convertSignalInfoEntries(signalInfo) {
        const signals = signalInfo.reduce((acc, curr) => {
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
                    devices: []
                };
            }

            acc[curr.signalId].devices.push({deviceId: curr.deviceId, deviceType: curr.deviceType, deviceDescription: curr.deviceDescription});

            return acc;
        }, {});

        return Object.values(signals).map(s => new SignalInfo(s));
    }

    convertSignalsDataWrapper(wrappers) {
        const grouped = wrappers.reduce((acc, curr) => {
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

    convertSignalAssociationsEntries(signalAssociations) {
        const theses = [
            ...new Map(
                signalAssociations
                    .filter(s => s.associationType === DeviceTargetType.THESIS)
                    .map(t => [t.thesisId, { id: t.thesisId, name: t.thesisName }])
            ).values()
        ]
        const sectors = [
            ...new Map(
                signalAssociations
                    .filter(s => s.associationType === DeviceTargetType.SECTOR)
                    .map(t => [t.sectorId, { id: t.sectorId, name: t.sectorName }])
            ).values()
        ]
        const fields = [
            ...new Map(
                signalAssociations
                    .filter(s => s.associationType === DeviceTargetType.FIELD)
                    .map(t => [t.fieldId, { id: t.fieldId, name: t.fieldName }])
            ).values()
        ]

        return { theses: theses, sectors: sectors, fields: fields }
    }

    convertCalendarWrapper(wrappers) {
        const groupedMap = wrappers.reduce((acc, curr) => {
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

    convertWateringAlgorithmParamsWrapper(results) {
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

    convertOptimalStateWrapper(results) {
        const optimalProfile = results.map(v => new OptimalProfileData(v.x, v.y, v.z, v.value, v.weight))
        return new OptimalStateData(results[0].thesisName, results[0].gridId, results[0].binningId, results[0].validFrom, results[0].validTo, results[0].stopPercentage, results[0].optimalDryBound, results[0].optimalWetBound, optimalProfile)
    }

    convertWateringAdviceWrapper(adviceWrapper) {
        return new WateringAdvice(adviceWrapper.thesisName, adviceWrapper.advice, adviceWrapper.duration, adviceWrapper.imageTimestamp,
            adviceWrapper.wateringStart, adviceWrapper.r, adviceWrapper.lastWatering);
    }

    convertPunctualDistanceWrapper(results) {
        const distances = results.map(v => new OptimalProfileData(v.x, v.y, v.z, v.distance, v.weight))
        return new DistanceProfile(results[0].thesisName, results[0].timestamp, distances)
    }

    convertOptimalDistanceWrapper(wrappers) {
        const grouped = wrappers.reduce((acc, curr) => {
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

    convertInterpolatedMeansWrapper(results) {
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
}

export default DtoConverter;
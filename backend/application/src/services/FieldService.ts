import { TABLES } from "../commons/constants.js";
import { GridOptimalProfile } from "../dtos/optStateDto.js";
import DtoConverter from "./DtoConverter.js";
import { _updateEntity } from "../commons/entityServiceUtils.js";
import FarmRepository from "../persistency/repository/FarmRepository.js";
import SectorRepository from "../persistency/repository/SectorRepository.js";
import ThesisRepository from "../persistency/repository/ThesisRepository.js";
import ThesesAllSignalsRepository from "../persistency/repository/ThesesAllSignalsRepository.js";
import InterpolatedProfileRepository from "../persistency/repository/InterpolatedProfileRepository.js";
import HumidityBinsRepository from "../persistency/repository/HumidityBinsRepository.js";
import OptimalDistanceRepository, { OptimalDistanceResult } from "../persistency/repository/OptimalDistanceRepository.js";
import WateringAdviceRepository from "../persistency/repository/WateringAdviceRepository.js";
import DeviceRepository from "../persistency/repository/DeviceRepository.js";
import WateringScheduleRepository from "../persistency/repository/WateringScheduleRepository.js";
import OptimalStateRepository from "../persistency/repository/OptimalStateRepository.js";
import SectorServiceRepository from "../persistency/repository/SectorServiceRepository.js";
import SectorServicesService from "./SectorServicesService.js";
import UserActionService from "./UserActionService.js";
import { Farm } from "../dtos/farmDto.js";
import { Sector, SectorData } from "../dtos/sectorDto.js";
import { Thesis, ThesisContribution } from "../dtos/thesisDto.js";
import { getErrorMessage } from "../commons/utils.js";

const dtoConverter = new DtoConverter();

const MINUTE_TO_SECONDS = 60;
const MONTH_TO_SECONDS = MINUTE_TO_SECONDS * 60 * 24 * 30;

class FieldService {
    constructor(
        private readonly farmRepository: FarmRepository,
        private readonly sectorRepository: SectorRepository,
        private readonly thesisRepository: ThesisRepository,
        private readonly thesesAllSignalsRepository: ThesesAllSignalsRepository,
        private readonly interpolatedProfileRepository: InterpolatedProfileRepository,
        private readonly humidityBinsRepository: HumidityBinsRepository,
        private readonly optimalDistanceRepository: OptimalDistanceRepository,
        private readonly wateringAdviceRepository: WateringAdviceRepository,
        private readonly deviceRepository: DeviceRepository,
        private readonly wateringScheduleRepository: WateringScheduleRepository,
        private readonly optimalStateRepository: OptimalStateRepository,
        private readonly sectorServiceRepository: SectorServiceRepository,
        private readonly sectorServicesService: SectorServicesService,
        private readonly userActionService: UserActionService
    ) { }

    async thesisExists(
        thesisId: number
    ): Promise<boolean> {
        return this.thesisRepository.thesisExists(
            thesisId
        );
    }

    async farmExists(
        farmId: number
    ): Promise<boolean> {
        return this.farmRepository.farmExists(farmId);
    }

    async sectorExists(
        sectorId: number
    ): Promise<boolean> {
        return this.sectorRepository.sectorExists(
            sectorId
        );
    }

    async createFarm(
        userId: number,
        farm: Farm
    ): Promise<number | undefined> {
        try {
            const farmCreated =
                await this.farmRepository.createFarm(
                    farm.name,
                    farm.companyId!,
                    farm.location!,
                    farm.createdAt
                );

            const farmId = farmCreated.id;

            if (farmId) {
                await this.userActionService.logCreation(
                    userId,
                    TABLES.FARM,
                    farmId,
                    null
                );

                return farmId;
            }

            return undefined;
        } catch (error) {
            console.error(
                `Error creating farm ${farm.name}: ${getErrorMessage(error)}`
            );

            throw error;
        }
    }

    async updateFarm(
        userId: number,
        farm: Farm
    ): Promise<void> {
        await _updateEntity(
            userId,
            farm,
            this.farmRepository.updateFarm.bind(
                this.farmRepository
            ),
            this.userActionService,
            TABLES.FARM
        );
    }

    async getFarms(
        filteringIds: number[],
        timeFilterFrom: number,
        timeFilterTo: number
    ) {
        const result =
            await this.farmRepository.getFarms(
                filteringIds,
                timeFilterFrom,
                timeFilterTo
            );

        return dtoConverter.convertFarms(result);
    }

    async createSector(
        userId: number,
        sector: Sector
    ): Promise<number | undefined> {
        try {
            const sectorCreated: any =
                await this.sectorRepository.createSector(
                    sector
                );

            const sectorId = sectorCreated.id;

            if (sectorId) {
                await this.userActionService.logCreation(
                    userId,
                    TABLES.SECTOR,
                    sectorId,
                    null
                );

                return sectorId;
            }

            return undefined;
        } catch (error) {
            console.error(
                `Error creating sector ${sector.name}: ${getErrorMessage(error)}`
            );

            throw error;
        }
    }

    async updateSector(
        userId: number,
        sector: SectorData
    ): Promise<void> {
        await _updateEntity(
            userId,
            sector,
            this.sectorRepository.updateSector.bind(
                this.sectorRepository
            ),
            this.userActionService,
            TABLES.SECTOR
        );
    }

    async createThesis(
        userId: number,
        thesis: Thesis
    ): Promise<number> {
        const newThesisId =
            await this.thesisRepository.createThesis(
                { name: thesis.name, validFrom: thesis.validFrom || Date.now() / 1000 }
            );

        if (!newThesisId) {
            throw new Error(
                "Impossible to create thesis"
            );
        }

        await this.userActionService.logCreation(
            userId,
            TABLES.THESIS,
            newThesisId,
            null
        );

        const assignmentId =
            await this.sectorRepository.assignThesisToSector(
                newThesisId,
                thesis.sectorId,
                undefined,
                thesis.validFrom ??
                Math.floor(Date.now() / 1000)
            );

        await this.userActionService.logCreation(
            userId,
            TABLES.THESIS_IN_SECTOR,
            assignmentId,
            null
        );

        return newThesisId;
    }

    async updateThesis(
        userId: number,
        thesis: Thesis | {id: number}
    ): Promise<void> {
        await _updateEntity(
            userId,
            thesis,
            this.thesisRepository.updateThesis.bind(
                this.thesisRepository
            ),
            this.userActionService,
            TABLES.THESIS
        );
    }

    async getFarmDetails(
        farmId: number,
        timeFilterFrom: number,
        timeFilterTo: number,
        userId: number,
        isAdmin: boolean
    ) {
        const result =
            await this.farmRepository.getFarmDetails(
                farmId,
                timeFilterFrom,
                timeFilterTo,
                userId,
                isAdmin
            );

        return dtoConverter.convertFarmDataWrapper(
            result
        );
    }

    async getMeasurementsByThesis(
        thesisId: number,
        signalTypes: string[],
        timeFilterFrom: number,
        timeFilterTo: number,
        aggregationType: string,
        aggregationPeriod?: number | null,
        offset?: number | null
    ) {
        const period =
            aggregationPeriod ??
            this.getDefaultAggregationPeriod(
                timeFilterFrom,
                timeFilterTo
            );

        const result =
            await this.thesesAllSignalsRepository
                .getMeasurementsByThesis(
                    thesisId,
                    signalTypes,
                    timeFilterFrom,
                    timeFilterTo,
                    aggregationType,
                    period,
                    offset ?? period / 2
                );

        return dtoConverter.convertMeasurementsDataWrapper(
            result
        );
    }

    getDefaultAggregationPeriod(
        timeFilterFrom: number,
        timeFilterTo: number
    ): number {
        const requestPeriod =
            timeFilterTo - timeFilterFrom;

        const rules = [
            {
                limit: 6 * MONTH_TO_SECONDS,
                period:
                    24 *
                    60 *
                    MINUTE_TO_SECONDS,
            },
            {
                limit: 3 * MONTH_TO_SECONDS,
                period:
                    12 *
                    60 *
                    MINUTE_TO_SECONDS,
            },
            {
                limit: MONTH_TO_SECONDS,
                period:
                    3 *
                    60 *
                    MINUTE_TO_SECONDS,
            },
            {
                limit:
                    8 *
                    24 *
                    60 *
                    MINUTE_TO_SECONDS,
                period:
                    60 *
                    MINUTE_TO_SECONDS,
            },
        ];

        const rule = rules.find(
            (r) => requestPeriod > r.limit
        );

        return (
            rule?.period ??
            MINUTE_TO_SECONDS
        );
    }

    async getHeatmapByThesis(
        thesisId: number,
        timeFilterFrom: number,
        timeFilterTo: number
    ) {
        const result =
            await this.interpolatedProfileRepository
                .getInterpolatedProfiles(
                    thesisId,
                    timeFilterFrom,
                    timeFilterTo
                );

        return dtoConverter.convertHeatmapDataWrapper(
            result
        );
    }

    async getHumidityBinsByThesis(
        thesisId: number,
        timeFilterFrom: number,
        timeFilterTo: number
    ) {
        const result =
            await this.humidityBinsRepository
                .getHumidityBins(
                    thesisId,
                    timeFilterFrom,
                    timeFilterTo
                );

        return dtoConverter.convertHumidityBinsDataWrapper(
            result
        );
    }

    async getWaterAggregateByThesis(
        thesisId: number,
        timeFilterFrom: number,
        timeFilterTo: number
    ) {
        const aggregationPeriod =
            24 *
            60 *
            MINUTE_TO_SECONDS;

        const advicesAndExpectedWater =
            await this.thesesAllSignalsRepository
                .getAdvicesAndExpectedWaterByThesis(
                    thesisId,
                    timeFilterFrom,
                    timeFilterTo,
                    aggregationPeriod,
                    0
                );

        const measurementsEt0 =
            await this.thesesAllSignalsRepository
                .getMeasurementsByThesis(
                    thesisId,
                    ["ET0"],
                    timeFilterFrom,
                    timeFilterTo,
                    "SUM",
                    aggregationPeriod,
                    0
                );

        measurementsEt0.forEach(
            (measurement) => {
                if (
                    typeof measurement ===
                    "object" &&
                    measurement !== null &&
                    "value" in measurement
                ) {
                    const m = measurement as {
                        value: unknown;
                    };

                    m.value = -Math.abs(
                        Number(m.value)
                    );
                }
            }
        );

        const measurements =
            await this.thesesAllSignalsRepository
                .getMeasurementsByThesis(
                    thesisId,
                    [
                        "DRIPPER",
                        "SPRINKLER",
                        "PLUV_CURR",
                        "FOGGER",
                    ],
                    timeFilterFrom,
                    timeFilterTo,
                    "SUM",
                    aggregationPeriod,
                    0
                );

        return dtoConverter.convertMeasurementsDataWrapper(
            [
                ...advicesAndExpectedWater,
                ...measurements,
                ...measurementsEt0,
            ]
        );
    }

    async getSectors(
        filteringIds: number[],
        timeFilterFrom: number,
        timeFilterTo: number
    ) {
        const result =
            await this.sectorRepository.getSectors(
                filteringIds,
                timeFilterFrom,
                timeFilterTo
            );

        return dtoConverter.convertSectorsDataWrapper(
            result
        );
    }

    async getSectorDetails(
        sectorId: number,
        timeFilterFrom: number,
        timeFilterTo: number
    ) {
        const result =
            await this.sectorRepository.getSectorDetails(
                sectorId,
                timeFilterFrom,
                timeFilterTo
            );

        return dtoConverter.convertSectorDataWrapper(
            result
        );
    }

    async getThesisDetails(
        thesisId: number,
        timeFilterFrom: number,
        timeFilterTo: number
    ) {
        const result =
            await this.thesisRepository.getThesisDetails(
                thesisId,
                timeFilterFrom,
                timeFilterTo
            );

        if (result) {
            return dtoConverter.convertThesisDataWrapper(
                result
            );
        }

        return undefined;
    }

    async getDevicesByThesis(
        thesisId: number,
        timestamp: number,
        deviceTypes?: string[],
        includeAncestors?: boolean
    ) {
        const result =
            await this.thesesAllSignalsRepository
                .getDevicesByThesis(
                    thesisId,
                    timestamp,
                    deviceTypes,
                    includeAncestors
                );

        return dtoConverter.convertDevicesDataWrapper(
            result
        );
    }

    async getDevicesBySector(
        sectorId: number,
        timestamp: number,
        deviceTypes: string[],
        includeAncestors: boolean,
        includeDescendants: boolean
    ) {
        const result =
            await this.thesesAllSignalsRepository
                .getDevicesBySector(
                    sectorId,
                    timestamp,
                    deviceTypes,
                    includeAncestors,
                    includeDescendants
                );

        return dtoConverter.convertDevicesDataWrapper(
            result
        );
    }

    async getDevicesByFarm(
        farmId: number,
        timestamp: number,
        deviceTypes: string[],
        includeDescendants: boolean,
        userId: number,
        isAdmin: boolean
    ) {
        const result =
            await this.thesesAllSignalsRepository
                .getDevicesByFarm(
                    farmId,
                    timestamp,
                    deviceTypes,
                    includeDescendants,
                    userId,
                    isAdmin
                );

        return dtoConverter.convertDevicesDataWrapper(
            result
        );
    }

    async getBinningInfo(
        binningId: number
    ) {
        return dtoConverter
            .convertBinningInfoWrapper(
                await this.humidityBinsRepository
                    .getBinningInfo(binningId)
            )?.[0];
    }

    async getAllBinningInfo() {
        try {
            const result =
                await this.humidityBinsRepository
                    .getBinningInfo();

            return dtoConverter.convertBinningInfoWrapper(
                result
            );
        } catch (error) {
            console.error(
                `Error retrieving binning info: ${getErrorMessage(error)}`
            );

            throw error;
        }
    }

    async getSignalsByThesis(
        thesisId: number,
        timestamp: number,
        signalTypes: string[]
    ) {
        const result =
            await this.thesesAllSignalsRepository
                .getSignalsByThesis(
                    thesisId,
                    timestamp,
                    signalTypes
                );

        return dtoConverter.convertSignalsDataWrapper(
            result
        );
    }

    async getPunctualDistance(
        thesisId: number,
        timestamp: number
    ) {
        const result =
            await this.optimalDistanceRepository
                .findPunctualDistance(
                    thesisId,
                    timestamp
                );

        return dtoConverter.convertPunctualDistanceWrapper(
            result
        );
    }

    async getOptimalState(
        thesisId: number,
        timestamp: number
    ) {
        const result =
            await this.thesisRepository.getOptimalState(
                thesisId,
                timestamp
            );

        if (result.length > 0) {
            return dtoConverter.convertOptimalStateWrapper(
                result
            );
        }

        return undefined;
    }

    async getOptimalDistanceData(
        scope: "sector" | "thesis",
        id: number,
        timeFilterFrom: number,
        timeFilterTo: number,
        algorithmViewFlag: boolean
    ) {
        let result: OptimalDistanceResult[] = [];

        if (scope === "sector") {
            result =
                await this.optimalDistanceRepository
                    .findSectorOptimalDistance(
                        id,
                        timeFilterFrom,
                        timeFilterTo,
                        algorithmViewFlag
                    );
        } else {
            result =
                await this.optimalDistanceRepository
                    .findThesisOptimalDistance(
                        id,
                        timeFilterFrom,
                        timeFilterTo,
                        algorithmViewFlag
                    );
        }

        return dtoConverter.convertOptimalDistanceWrapper(
            result
        );
    }

    async getInterpolatedMeans(
        thesisId: number,
        timeFilterFrom: number,
        timeFilterTo: number
    ) {
        const result =
            await this.interpolatedProfileRepository
                .getInterpolatedMeans(
                    thesisId,
                    timeFilterFrom,
                    timeFilterTo
                );

        return dtoConverter.convertInterpolatedMeansWrapper(
            result
        );
    }

    async findThesisPoints(
        gridId: number
    ) {
        return this.interpolatedProfileRepository
            .findThesisPoints(gridId);
    }

    async createMatrixOptimalState(
        userId: number,
        gridOptimalProfiles: GridOptimalProfile
    ): Promise<number> {
        const matrixData =
            await this.optimalStateRepository
                .createMatrixOptimalState(
                    gridOptimalProfiles.gridId,
                    gridOptimalProfiles.validFrom,
                    gridOptimalProfiles.validTo,
                    gridOptimalProfiles.stopThreshold,
                    gridOptimalProfiles.optimalDryBound,
                    gridOptimalProfiles.optimalWetBound,
                    gridOptimalProfiles.optimalTolerance,
                );

        if (
            !matrixData.matrixId ||
            !matrixData.optimalProfileAssignmentId
        ) {
            throw new Error(
                "Impossible to create optimal matrix for this thesis"
            );
        }

        const matrixId = matrixData.matrixId;

        for (
            const optimalCell of
            gridOptimalProfiles.optimalProfile
        ) {
            await this.optimalStateRepository
                .createOptimalProfileCell(
                    matrixId,
                    optimalCell.x,
                    optimalCell.y,
                    optimalCell.z,
                    optimalCell.value,
                    optimalCell.weight
                );
        }

        await this.userActionService.logCreation(
            userId,
            TABLES.OPTIMAL_PROFILE,
            matrixData.optimalProfileAssignmentId,
            null
        );

        return matrixData.optimalProfileAssignmentId;
    }

    async setOptimalState(
        userId: number,
        gridId: number,
        validFrom: number,
        validTo: number | null,
        stopThreshold: number,
        optimalWetBound: number,
        optimalDryBound: number,
        optimalTolerance: number,
        profileId?: number
    ): Promise<number> {
        const matrixData =
            await this.optimalStateRepository
                .createMatrixOptimalState(
                    gridId,
                    validFrom,
                    validTo,
                    stopThreshold,
                    optimalDryBound,
                    optimalWetBound,
                    optimalTolerance,
                    profileId
                );

        if (
            !matrixData.matrixId ||
            !matrixData.optimalProfileAssignmentId
        ) {
            throw new Error(
                "Impossible to create optimal matrix for this thesis"
            );
        }

        await this.userActionService.logCreation(
            userId,
            TABLES.OPTIMAL_PROFILE,
            matrixData.optimalProfileAssignmentId,
            null
        );

        return matrixData.optimalProfileAssignmentId;
    }

    async setThesesContributions(
        userId: number,
        sectorId: number,
        thesesContributions: ThesisContribution[],
        validFrom: number,
        validTo?: number | null
    ): Promise<void> {
        const sectorDetails =
            await this.getSectorDetails(
                sectorId,
                validFrom,
                validFrom
            );

        const thesesIds = new Set<number>(
            sectorDetails.theses.map(
                (thesis: { id: number }) =>
                    thesis.id
            )
        );

        const paramThesisIds = new Set(
            thesesContributions.map(
                (thesis) => thesis.id
            )
        );

        const invalidParams =
            [...paramThesisIds].filter(
                (id) => !thesesIds.has(id)
            );

        if (invalidParams.length > 0) {
            throw new Error(
                `Invalid thesis IDs: ${invalidParams.join(
                    ", "
                )}`
            );
        }

        await Promise.all(
            thesesContributions.map(
                async (thesis) => {
                    const sectorAssignmentsIds =
                        await this.thesisRepository
                            .disableThesisInSector(
                                sectorId,
                                thesis.id,
                                validFrom
                            );

                    if (sectorAssignmentsIds) {
                        await this.userActionService
                            .logDisabling(
                                userId,
                                TABLES.THESIS_IN_SECTOR,
                                sectorAssignmentsIds,
                                null
                            );
                    }

                    const assignmentId =
                        await this.sectorRepository
                            .assignThesisToSector(
                                thesis.id,
                                sectorId,
                                thesis.weight,
                                validFrom,
                                validTo
                            );

                    if (assignmentId) {
                        await this.userActionService
                            .logCreation(
                                userId,
                                TABLES.THESIS_IN_SECTOR,
                                assignmentId,
                                null
                            );
                    }
                }
            )
        );

        await Promise.all(
            [...thesesIds]
                .filter(
                    (id) =>
                        !paramThesisIds.has(id)
                )
                .map(async (id) => {
                    const sectorAssignmentsIds =
                        await this.thesisRepository
                            .disableThesisInSector(
                                sectorId,
                                id,
                                validFrom
                            );

                    if (sectorAssignmentsIds) {
                        await this.userActionService
                            .logDisabling(
                                userId,
                                TABLES.THESIS_IN_SECTOR,
                                sectorAssignmentsIds,
                                null
                            );
                    }

                    const assignmentId =
                        await this.sectorRepository
                            .assignThesisToSector(
                                id,
                                sectorId,
                                null,
                                validFrom,
                                validTo
                            );

                    if (assignmentId) {
                        await this.userActionService
                            .logCreation(
                                userId,
                                TABLES.THESIS_IN_SECTOR,
                                assignmentId,
                                null
                            );
                    }
                })
        );
    }

    async disableThesis(
        userId: number,
        thesisId: number,
        timestamp: number
    ): Promise<void> {
        try {
            const algorithmId =
                await this.wateringAdviceRepository
                    .setWateringAlgorithmParamsEndDate(
                        thesisId,
                        timestamp
                    );

            if (algorithmId) {
                await this.userActionService.logDisabling(
                    userId,
                    TABLES.WATERING_ALGORITHM,
                    algorithmId
                );
            }

            const devices =
                await this.deviceRepository
                    .getThesisAssociatedDevices(
                        thesisId,
                        timestamp
                    );

            await Promise.all(
                devices.map(async (device) => {
                    const deviceAssignmentId =
                        await this.deviceRepository
                            .unlinkDeviceFromThesis({
                                thesisId,
                                deviceId: device.id,
                                validTo: timestamp,
                            });

                    if (deviceAssignmentId) {
                        await this.userActionService
                            .logDisabling(
                                userId,
                                TABLES.THESIS_DEVICE,
                                deviceAssignmentId
                            );
                    }
                })
            );

            const sectorAssignmentsIds =
                await this.thesisRepository
                    .disableThesisFromSectors(
                        thesisId,
                        timestamp
                    );

            if (sectorAssignmentsIds) {
                await this.userActionService.logDisabling(
                    userId,
                    TABLES.THESIS_IN_SECTOR,
                    sectorAssignmentsIds
                );
            }

            await this.thesisRepository.disableThesis(
                thesisId,
                timestamp
            );

            await this.userActionService.logDisabling(
                userId,
                TABLES.THESIS,
                thesisId
            );
        } catch (error) {
            console.error(
                `Error disabling thesis: ${getErrorMessage(error)}`
            );

            throw error;
        }
    }

    async deleteThesis(
        userId: number,
        thesisId: number
    ): Promise<void> {
        try {
            const algorithmParamsIds =
                await this.wateringAdviceRepository
                    .deleteWateringAlgorithmParams(
                        thesisId
                    );

            if (algorithmParamsIds) {
                await this.userActionService.logDeletion(
                    userId,
                    TABLES.WATERING_ALGORITHM,
                    algorithmParamsIds
                );
            }

            await this.wateringAdviceRepository
                .deleteWateringAdvices(thesisId);

            const thesisDevId =
                await this.deviceRepository
                    .deleteDeviceInThesis(thesisId);

            if (thesisDevId) {
                await this.userActionService.logDeletion(
                    userId,
                    TABLES.THESIS_DEVICE,
                    thesisDevId
                );
            }

            const sectorAssignmentsIds =
                await this.thesisRepository
                    .deleteThesisFromSectors(thesisId);

            if (sectorAssignmentsIds) {
                await this.userActionService.logDeletion(
                    userId,
                    TABLES.THESIS_IN_SECTOR,
                    sectorAssignmentsIds
                );
            }

            await this.thesisRepository.deleteThesis(
                thesisId
            );

            await this.userActionService.logDeletion(
                userId,
                TABLES.THESIS,
                thesisId
            );
        } catch (error) {
            console.error(
                `Error deleting thesis: ${getErrorMessage(error)}`
            );

            throw error;
        }
    }

    async disableSector(
        userId: number,
        sectorId: number,
        timestamp: number
    ): Promise<void> {
        try {
            const devices =
                await this.deviceRepository
                    .getSectorAssociatedDevices(
                        sectorId,
                        timestamp
                    );

            await Promise.all(
                devices.map(async (device) => {
                    const deviceAssignmentId =
                        await this.deviceRepository
                            .unlinkDeviceFromSector({
                                sectorId,
                                deviceId: device.id,
                                validTo: timestamp,
                            });

                    if (deviceAssignmentId) {
                        await this.userActionService
                            .logDisabling(
                                userId,
                                TABLES.SECTOR_DEVICE,
                                deviceAssignmentId,
                                null
                            );
                    }
                })
            );

            const sectorData =
                await this.getSectorDetails(
                    sectorId,
                    timestamp,
                    timestamp
                );

            if (
                sectorData &&
                sectorData.theses &&
                Array.isArray(sectorData.theses)
            ) {
                await Promise.all(
                    sectorData.theses.map(
                        (thesis: { id: number }) =>
                            this.disableThesis(
                                userId,
                                thesis.id,
                                timestamp
                            )
                    )
                );
            }

            const sectorServices =
                await this.sectorServicesService
                    .getSectorServices(
                        sectorId,
                        timestamp,
                        9999999999
                    );

            if (Array.isArray(sectorServices)) {
                await Promise.all(
                    sectorServices.map((service) =>
                        this.sectorServicesService
                            .disableSectorService(
                                userId,
                                sectorId,
                                service.id,
                                timestamp
                            )
                    )
                );
            }

            const deletedEventsIds =
                await this.wateringScheduleRepository
                    .deleteWateringEvents(
                        sectorId,
                        timestamp
                    );

            if (deletedEventsIds) {
                await this.userActionService.logDeletion(
                    userId,
                    TABLES.WATERING_EVENT,
                    deletedEventsIds,
                    null
                );
            }

            await this.sectorRepository.disableSector(
                sectorId,
                timestamp
            );

            await this.userActionService.logDisabling(
                userId,
                TABLES.SECTOR,
                sectorId
            );
        } catch (error) {
            console.error(
                `Error disabling sector ${sectorId}: ${getErrorMessage(error)}`
            );

            throw error;
        }
    }

    async deleteSector(
        userId: number,
        sectorId: number
    ): Promise<void> {
        try {
            const deletedEventsIds =
                await this.wateringScheduleRepository
                    .deleteWateringEvents(
                        sectorId,
                        0
                    );

            if (deletedEventsIds) {
                await this.userActionService.logDeletion(
                    userId,
                    TABLES.WATERING_EVENT,
                    deletedEventsIds
                );
            }

            const sectorDevId =
                await this.deviceRepository
                    .deleteDeviceInSector(sectorId);

            if (sectorDevId) {
                await this.userActionService.logDeletion(
                    userId,
                    TABLES.SECTOR_DEVICE,
                    sectorDevId
                );
            }

            const sectorServiceIds =
                await this.sectorServiceRepository
                    .deleteSectorServices(sectorId);

            if (sectorServiceIds) {
                await this.userActionService.logDeletion(
                    userId,
                    TABLES.SECTOR_SERVICE,
                    sectorServiceIds
                );
            }

            const sectorData =
                await this.getSectorDetails(
                    sectorId,
                    0,
                    9999999999
                );

            if (
                sectorData &&
                sectorData.theses &&
                Array.isArray(sectorData.theses)
            ) {
                await Promise.all(
                    sectorData.theses.map(
                        (thesis: { id: number }) =>
                            this.deleteThesis(
                                userId,
                                thesis.id
                            )
                    )
                );
            }

            await this.sectorRepository.deleteSector(
                sectorId
            );

            await this.userActionService.logDeletion(
                userId,
                TABLES.SECTOR,
                sectorId
            );
        } catch (error) {
            console.error(
                `Error deleting sector: ${getErrorMessage(error)}`
            );

            throw error;
        }
    }

    async disableFarm(
        userId: number,
        isAdmin: boolean,
        farmId: number,
        timestamp: number
    ): Promise<void> {
        try {
            const devices =
                await this.deviceRepository
                    .getFarmAssociatedDevices(
                        farmId,
                        timestamp
                    );

            await Promise.all(
                devices.map(async (device) => {
                    const deviceAssignmentId =
                        await this.deviceRepository
                            .unlinkDeviceFromFarm({
                                farmId,
                                deviceId: device.id,
                                validTo: timestamp,
                            });

                    if (deviceAssignmentId) {
                        await this.userActionService
                            .logDisabling(
                                userId,
                                TABLES.FARM_DEVICE,
                                deviceAssignmentId,
                                null
                            );
                    }
                })
            );

            const farmData =
                await this.farmRepository.getFarmDetails(
                    farmId,
                    timestamp,
                    timestamp,
                    userId,
                    isAdmin
                );

            if (
                farmData &&
                farmData.sectors &&
                Array.isArray(farmData.sectors)
            ) {
                await Promise.all(
                    farmData.sectors.map(
                        (sector: { id: number }) =>
                            this.disableSector(
                                userId,
                                sector.id,
                                timestamp
                            )
                    )
                );
            }

            await this.farmRepository.disableFarm(
                farmId,
                timestamp
            );

            await this.userActionService.logDisabling(
                userId,
                TABLES.FARM,
                farmId
            );
        } catch (error) {
            console.error(
                `Error disabling farm: ${getErrorMessage(error)}`
            );

            throw error;
        }
    }

    async deleteFarm(
        userId: number,
        farmId: number
    ): Promise<void> {
        try {
            const farmDevId =
                await this.deviceRepository
                    .deleteDeviceInFarm(farmId);

            if (farmDevId) {
                await this.userActionService.logDeletion(
                    userId,
                    TABLES.FARM_DEVICE,
                    farmDevId
                );
            }

            const farmData =
                await this.sectorRepository
                    .getSectorsByFarm(farmId);

            if (
                farmData &&
                Array.isArray(farmData)
            ) {
                await Promise.all(
                    farmData.map((sector: any) =>
                        this.deleteSector(
                            userId,
                            sector.id
                        )
                    )
                );
            }

            await this.farmRepository.deleteFarm(
                farmId
            );

            await this.userActionService.logDeletion(
                userId,
                TABLES.FARM,
                farmId
            );
        } catch (error) {
            console.error(
                `Error deleting farm: ${getErrorMessage(error)}`
            );

            throw error;
        }
    }
}

export default FieldService;
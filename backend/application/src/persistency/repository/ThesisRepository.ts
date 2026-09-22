import { Op, QueryTypes, Sequelize } from "sequelize";
import { HUMIDITY_DEVICE_TYPE } from "../../commons/constants.js";
import { getErrorMessage } from "../../commons/utils.js";
import { _deleteFromModelByParams } from "../../commons/repositoryUtils.js";
import { CompanyModel } from "../model/CompanyModel.js";
import { FarmModel } from "../model/FarmModel.js";
import { SectorModel } from "../model/SectorModel.js";
import { ThesisModel } from "../model/ThesisModel.js";
import { ThesisInSectorModel } from "../model/ThesisInSectorModel.js";


export interface OptimalStateResult {
    thesisName: string;
    binningId: number;
    optimalProfileId: number;
    gridId: number;
    validFrom: number;
    validTo: number | null;
    stopThreshold: number;
    optimalDryBound: number;
    optimalWetBound: number;
    optimalTolerance: number;
    x: number;
    y: number;
    z: number;
    weight: number;
    value: number;
}

export interface ThesisDetailsResult {
    thesisId: number;
    validFrom: number;
    validTo: number | null;
    weight: number | null;

    thesis: {
        thesisName: string;
    };

    sector: {
        id: number;
        sectorName: string;
        culture: string | null;
        cultureType: string | null;
        location: unknown;
        dripperCapacity: number | null;
        sprinklerCapacity: number | null;
        doubleWing: boolean | null;

        farm: {
            id: number;
            farmName: string;
            location: unknown;

            company: {
                id: number;
                companyName: string;
            };
        };
    };
}


class ThesisRepository {
    private readonly Company: typeof CompanyModel;
    private readonly Farm: typeof FarmModel;
    private readonly Sector: typeof SectorModel;
    private readonly Thesis: typeof ThesisModel;
    private readonly ThesisInSector: typeof ThesisInSectorModel;
    private readonly sequelize: Sequelize;

    constructor(
        models: {
            Company: typeof CompanyModel;
            Farm: typeof FarmModel;
            Sector: typeof SectorModel;
            Thesis: typeof ThesisModel;
            ThesisInSector: typeof ThesisInSectorModel;
        },
        sequelize: Sequelize,
    ) {
        this.Company = models.Company;
        this.Farm = models.Farm;
        this.Sector = models.Sector;
        this.Thesis = models.Thesis;
        this.ThesisInSector = models.ThesisInSector;
        this.sequelize = sequelize;
    }

    async thesisExists(thesisId: number): Promise<boolean> {
        const count = await this.Thesis.count({
            where: { id: thesisId },
        });

        return count > 0;
    }

    async createThesis(
        thesisData: {
            name: string;
            validFrom: number;
        },
    ): Promise<number> {
        try {
            const thesis = await this.Thesis.create({
                thesisName: thesisData.name,
                createdAt: thesisData.validFrom,
            });

            return thesis.id;
        } catch (error: unknown) {
            throw new Error(
                `Error creating thesis: ${getErrorMessage(error)}`,
            );
        }
    }

    async disableThesisInSector(
        sectorId: number,
        thesisId: number,
        timestamp: number,
    ): Promise<number | null> {
        const [, updatedRecords] = await this.ThesisInSector.update(
            {
                validTo: timestamp,
            },
            {
                where: {
                    sectorId,
                    thesisId,
                    validFrom: {
                        [Op.lt]: timestamp,
                    },
                    validTo: {
                        [Op.or]: {
                            [Op.is]: null,
                            [Op.gt]: timestamp,
                        },
                    },
                },
                returning: true,
            },
        );

        if (updatedRecords.length > 0) {
            return updatedRecords[0].id;
        }

        return null;
    }

    async getThesisDetails(
        thesisId: number,
        timeFilterFrom: number,
        timeFilterTo: number,
    ): Promise<ThesisDetailsResult> {
        const result = await this.ThesisInSector.findOne({
            where: {
                thesisId,
                validFrom: {
                    [Op.lt]: timeFilterTo,
                },
                validTo: {
                    [Op.or]: {
                        [Op.is]: null,
                        [Op.gt]: timeFilterFrom,
                    },
                },
            },
            include: [
                {
                    model: this.Thesis,
                    as: "thesis",
                    attributes: ["thesisName", "createdAt", "disabledAt"],
                    where: {
                        createdAt: {
                            [Op.lt]: timeFilterTo,
                        },
                        disabledAt: {
                            [Op.or]: {
                                [Op.is]: null,
                                [Op.gt]: timeFilterFrom,
                            },
                        },
                    },
                },
                {
                    model: this.Sector,
                    as: "sector",
                    include: [
                        {
                            model: this.Farm,
                            as: "farm",
                            attributes: ["id", "farmName", "location"],
                            include: [
                                {
                                    model: this.Company,
                                    as: "company",
                                    attributes: ["id", "companyName"],
                                },
                            ],
                        },
                    ],
                },
            ],
            raw: true,
            nest: true,
        }) as unknown as ThesisDetailsResult;

        return result;
    }

    async getOptimalState(
        thesisId: number,
        timestamp: number,
    ): Promise<OptimalStateResult[]> {
        const query = `
            WITH validity_table AS (
                SELECT
                    device_id,
                    device_binning_id,
                    thesis_id,
                    thesis_name,
                    MAX(x) AS max_x,
                    MIN(x) AS min_x,
                    MAX(y) AS max_y,
                    MIN(y) AS min_y,
                    MAX(z) AS max_z,
                    MIN(z) AS min_z
                FROM theses_all_signals
                WHERE device_type = :HUMIDITY_DEVICE_TYPE
                    AND thesis_id = :thesisId
                GROUP BY
                    device_id,
                    thesis_id,
                    thesis_name,
                    device_binning_id
                HAVING MIN(valid_from) < :timestamp
                    AND MAX(COALESCE(valid_to, 'infinity')) > :timestamp
                LIMIT 1
            )
            SELECT
                v.thesis_name AS "thesisName",
                v.device_binning_id AS "binningId",
                gop.optimal_profile_id AS "optimalProfileId",
                gop.grid_id AS "gridId",
                gop.valid_from AS "validFrom",
                gop.valid_to AS "validTo",
                gop.stop_threshold AS "stopThreshold",
                gop.optimal_dry_bound AS "optimalDryBound",
                gop.optimal_wet_bound AS "optimalWetBound",
                gop.optimal_tolerance AS "optimalTolerance",
                op.x,
                op.y,
                op.z,
                op.weight,
                op.value
            FROM validity_table v
            JOIN grid_optimal_profile_assignment gop
                ON v.device_id = gop.grid_id
            JOIN optimal_profiles op
                ON op.profile_id = gop.optimal_profile_id
            WHERE gop.valid_from < :timestamp
                AND (gop.valid_to IS NULL OR gop.valid_to > :timestamp)
                AND op.x BETWEEN min_x AND max_x
                AND op.y BETWEEN min_y AND max_y
                AND op.z BETWEEN min_z AND max_z
        `;

        const results = await this.sequelize.query<OptimalStateResult>(
            query,
            {
                replacements: {
                    thesisId,
                    timestamp,
                    HUMIDITY_DEVICE_TYPE,
                },
                type: QueryTypes.SELECT,
            },
        );

        return results;
    }

    async disableThesisFromSectors(
        thesisId: number,
        timestamp: number,
    ): Promise<number[] | null> {
        try {
            const [, updatedRecords] = await this.ThesisInSector.update(
                {
                    validTo: timestamp,
                },
                {
                    where: {
                        thesisId,
                        validFrom: {
                            [Op.lt]: timestamp,
                        },
                        validTo: {
                            [Op.is]: null,
                        },
                    },
                    returning: true,
                },
            );

            if (updatedRecords.length > 0) {
                return updatedRecords.map((record) => record.id);
            }

            return null;
        } catch (error: unknown) {
            throw new Error(
                `Error disabling thesis from sector: ${getErrorMessage(error)}`,
            );
        }
    }

    async deleteThesisFromSectors(thesisId: number) {
        try {
            return await _deleteFromModelByParams(
                this.ThesisInSector,
                { thesisId },
            );
        } catch (error: unknown) {
            throw new Error(
                `Error deleting thesis from sector: ${getErrorMessage(error)}`,
            );
        }
    }

    async updateThesis(
        thesisId: number,
        updates: { name: string },
    ) {
        try {
            const thesis = await this.Thesis.findByPk(thesisId);

            if (!thesis) {
                throw new Error("Thesis not found");
            }

            const { name } = updates;

            return await thesis.update({
                thesisName: name,
            });
        } catch (error: unknown) {
            throw new Error(
                `Error while updating thesis caused by: ${getErrorMessage(error)}`,
            );
        }
    }

    async disableThesis(
        thesisId: number,
        timestamp: number,
    ): Promise<void> {
        try {
            await this.Thesis.update(
                {
                    disabledAt: timestamp,
                },
                {
                    where: {
                        id: thesisId,
                        disabledAt: {
                            [Op.is]: null,
                        },
                    },
                },
            );
        } catch (error: unknown) {
            throw new Error(
                `Error disabling thesis: ${getErrorMessage(error)}`,
            );
        }
    }

    async deleteThesis(thesisId: number) {
        try {
            return await _deleteFromModelByParams(
                this.Thesis,
                { id: thesisId },
            );
        } catch (error: unknown) {
            throw new Error(
                `Error deleting thesis: ${getErrorMessage(error)}`,
            );
        }
    }
}

export default ThesisRepository;
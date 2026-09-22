import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export class GridOptimalProfileAssignmentModel extends Model<
  InferAttributes<GridOptimalProfileAssignmentModel>,
  InferCreationAttributes<GridOptimalProfileAssignmentModel>
> {
  declare id: CreationOptional<number>;
  declare optimalProfileId: number;
  declare validFrom: number;
  declare validTo: number | null;
  declare gridId: number;
  declare stopThreshold: number | null;
  declare optimalDryBound: number | null;
  declare optimalWetBound: number | null;
  declare optimalTolerance: number | null;
}

export function initGridOptimalProfileAssignment(
  sequelize: Sequelize
): typeof GridOptimalProfileAssignmentModel {
  GridOptimalProfileAssignmentModel.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      optimalProfileId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: "optimal_profile_id",
      },
      validFrom: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        field: "valid_from",
      },
      validTo: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        field: "valid_to",
      },
      gridId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: "grid_id",
      },
      stopThreshold: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        field: "stop_threshold",
      },
      optimalDryBound: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        field: "optimal_dry_bound",
      },
      optimalWetBound: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        field: "optimal_wet_bound",
      },
      optimalTolerance: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        field: "optimal_tolerance",
      }
    },
    {
      modelName: "GridOptimalProfileAssignment",
      tableName: "grid_optimal_profile_assignment",
      timestamps: false,
      sequelize,
    }
  );

  return GridOptimalProfileAssignmentModel;
}

export default initGridOptimalProfileAssignment;
import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";
import type {
  IMeasurement,
  TMeasurementValues,
} from "@moon-tailors/contracts";
import { EResource, hasMeasurementValues } from "@moon-tailors/contracts";
import { PermissionsService } from "../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import type { EntityQueryConfig } from "../../common/query";
import { GarmentTypesService } from "../garment-types/garment-types.service";
import { MeasurementEntity } from "./entities/measurement.entity";

export const MEASUREMENT_QUERY: EntityQueryConfig = {
  alias: "measurement",
  searchable: [],
  sortable: ["createdAt", "updatedAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

const VALUE_KEYS = [
  "length",
  "chest",
  "waist",
  "hip",
  "shoulder",
  "sleeve",
  "neck",
  "armhole",
  "cuff",
  "trouserLength",
  "thigh",
  "bottom",
  "extraNotes",
] as const;

function emptyToNull(value?: string | null) {
  const text = value?.trim();
  return text ? text : null;
}

@Injectable()
export class MeasurementsService implements OnModuleInit {
  private readonly entity: IBoundEntityService<MeasurementEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly permissions: PermissionsService,
    private readonly garmentTypes: GarmentTypesService,
  ) {
    this.entity = this.entityService.bind(
      MeasurementEntity,
      MEASUREMENT_QUERY,
    );
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.MEASUREMENTS);
  }

  pickValues(
    input: TMeasurementValues | MeasurementEntity,
  ): TMeasurementValues {
    return {
      length: num(input.length),
      chest: num(input.chest),
      waist: num(input.waist),
      hip: num(input.hip),
      shoulder: num(input.shoulder),
      sleeve: num(input.sleeve),
      neck: num(input.neck),
      armhole: num(input.armhole),
      cuff: num(input.cuff),
      trouserLength: num(input.trouserLength),
      thigh: num(input.thigh),
      bottom: num(input.bottom),
      extraNotes: emptyToNull(input.extraNotes) ?? undefined,
    };
  }

  toPayload(row: MeasurementEntity): IMeasurement {
    const values = this.pickValues(row);
    return {
      ...values,
      id: row.id,
      customerId: row.customerId,
      orderId: row.orderId,
      garmentTypeId: row.garmentTypeId,
      garmentType: row.garmentType
        ? this.garmentTypes.toPayload(row.garmentType)
        : null,
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
    };
  }

  findDefault(
    customerId: string,
    garmentTypeId: string,
  ): Promise<MeasurementEntity | null> {
    return this.entity
      .getRepository()
      .createQueryBuilder("measurement")
      .leftJoinAndSelect("measurement.garmentType", "garmentType")
      .where("measurement.customerId = :customerId", { customerId })
      .andWhere("measurement.garmentTypeId = :garmentTypeId", { garmentTypeId })
      .andWhere("measurement.orderId IS NULL")
      .andWhere("measurement.deletedAt IS NULL")
      .getOne();
  }

  listDefaults(customerId: string): Promise<MeasurementEntity[]> {
    return this.entity
      .getRepository()
      .createQueryBuilder("measurement")
      .leftJoinAndSelect("measurement.garmentType", "garmentType")
      .where("measurement.customerId = :customerId", { customerId })
      .andWhere("measurement.orderId IS NULL")
      .andWhere("measurement.deletedAt IS NULL")
      .orderBy("garmentType.sortOrder", "ASC")
      .addOrderBy("garmentType.name", "ASC")
      .getMany();
  }

  async upsertDefault(
    customerId: string,
    garmentTypeId: string,
    values?: TMeasurementValues,
  ): Promise<MeasurementEntity> {
    await this.garmentTypes.require(garmentTypeId);
    const existing = await this.findDefault(customerId, garmentTypeId);
    if (existing) {
      if (hasMeasurementValues(values)) {
        return this.updateValues(existing.id, values);
      }
      return this.requireWithType(existing.id);
    }
    const created = await this.entity.create({
      customerId,
      orderId: null,
      garmentTypeId,
    });
    if (hasMeasurementValues(values)) {
      return this.updateValues(created.id, values);
    }
    return this.requireWithType(created.id);
  }

  async copyDefault(
    customerId: string,
    fromGarmentTypeId: string,
    toGarmentTypeId: string,
  ): Promise<MeasurementEntity> {
    if (fromGarmentTypeId === toGarmentTypeId) {
      throw new BadRequestException("Pick a different garment to copy into");
    }
    const source = await this.findDefault(customerId, fromGarmentTypeId);
    if (!source) {
      throw new BadRequestException("Nothing to copy from that garment");
    }
    return this.upsertDefault(
      customerId,
      toGarmentTypeId,
      this.pickValues(source),
    );
  }

  async createOrderSnapshot(
    customerId: string,
    garmentTypeId: string,
    values?: TMeasurementValues,
  ): Promise<MeasurementEntity> {
    await this.garmentTypes.require(garmentTypeId);
    const source = await this.findDefault(customerId, garmentTypeId);
    const created = await this.entity.create({
      customerId,
      orderId: null,
      garmentTypeId,
      ...(source ? this.toColumnValues(this.pickValues(source)) : {}),
    });
    if (hasMeasurementValues(values)) {
      return this.updateValues(created.id, values);
    }
    return this.requireWithType(created.id);
  }

  async updateValues(
    id: string,
    input: TMeasurementValues,
  ): Promise<MeasurementEntity> {
    const values = this.pickValues(input);
    const patch: Partial<MeasurementEntity> = {};
    for (const key of VALUE_KEYS) {
      if (input[key] !== undefined) {
        if (key === "extraNotes") {
          patch.extraNotes = emptyToNull(values.extraNotes);
        } else {
          (patch as Record<string, unknown>)[key] = dec(
            values[key] as number | null | undefined,
          );
        }
      }
    }
    await this.entity.update(id, patch);
    return this.requireWithType(id);
  }

  get(id: string): Promise<MeasurementEntity> {
    return this.requireWithType(id);
  }

  attachToOrder(id: string, orderId: string): Promise<MeasurementEntity> {
    return this.entity.update(id, { orderId });
  }

  private requireWithType(id: string): Promise<MeasurementEntity> {
    return this.entity.require(id, { _relations: ["garmentType"] });
  }

  private toColumnValues(values: TMeasurementValues): Partial<MeasurementEntity> {
    return {
      length: dec(values.length),
      chest: dec(values.chest),
      waist: dec(values.waist),
      hip: dec(values.hip),
      shoulder: dec(values.shoulder),
      sleeve: dec(values.sleeve),
      neck: dec(values.neck),
      armhole: dec(values.armhole),
      cuff: dec(values.cuff),
      trouserLength: dec(values.trouserLength),
      thigh: dec(values.thigh),
      bottom: dec(values.bottom),
      extraNotes: emptyToNull(values.extraNotes),
    };
  }
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dec(value: number | null | undefined): string | null {
  return value == null ? null : String(value);
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

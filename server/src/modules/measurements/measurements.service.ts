import { Injectable, OnModuleInit } from "@nestjs/common";
import type {
  IMeasurement,
  TMeasurementValues,
} from "@moon-tailors/contracts";
import { EResource } from "@moon-tailors/contracts";
import { PermissionsService } from "../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import type { EntityQueryConfig } from "../../common/query";
import { MeasurementEntity } from "./entities/measurement.entity";

export const MEASUREMENT_QUERY: EntityQueryConfig = {
  alias: "measurement",
  searchable: [],
  sortable: ["createdAt", "updatedAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

const VALUE_KEYS = [
  "garmentType",
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
      garmentType: input.garmentType ?? undefined,
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
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
    };
  }

  createDefault(customerId: string): Promise<MeasurementEntity> {
    return this.entity.create({
      customerId,
      orderId: null,
    });
  }

  copyForOrder(
    source: MeasurementEntity,
    customerId: string,
    orderId: string | null,
  ): Promise<MeasurementEntity> {
    const values = this.pickValues(source);
    return this.entity.create({
      customerId,
      orderId,
      garmentType: values.garmentType ?? null,
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
    });
  }

  async updateValues(
    id: string,
    input: TMeasurementValues,
  ): Promise<MeasurementEntity> {
    const values = this.pickValues(input);
    const patch: Partial<MeasurementEntity> = {};
    for (const key of VALUE_KEYS) {
      if (input[key] !== undefined) {
        if (key === "garmentType") patch.garmentType = values.garmentType ?? null;
        else if (key === "extraNotes") {
          patch.extraNotes = emptyToNull(values.extraNotes);
        } else {
          (patch as Record<string, unknown>)[key] = dec(
            values[key] as number | null | undefined,
          );
        }
      }
    }
    return this.entity.update(id, patch);
  }

  get(id: string): Promise<MeasurementEntity> {
    return this.entity.require(id);
  }

  attachToOrder(id: string, orderId: string): Promise<MeasurementEntity> {
    return this.entity.update(id, { orderId });
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

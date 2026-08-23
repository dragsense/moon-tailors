import { Injectable } from "@nestjs/common";
import { ESettingType } from "@template/contracts";
import {
  EntityService,
  type IBoundEntityService,
} from "../../database";
import type { EntityQueryConfig } from "../../query";
import { SettingEntity } from "./entities";

type SettingInput = {
  value: unknown;
  type?: ESettingType;
  description?: string;
  /** When true, remove this key instead of writing (nullable prefs → clear). */
  clear?: boolean;
};

export const SETTING_QUERY: EntityQueryConfig = {
  alias: "setting",
  sortable: ["createdAt", "key"],
  defaultSort: { field: "key", order: "ASC" },
  searchable: ["key", "description"],
};

@Injectable()
export class BaseSettingsService {
  private readonly entity: IBoundEntityService<SettingEntity>;

  constructor(private readonly entityService: EntityService) {
    this.entity = this.entityService.bind(SettingEntity, SETTING_QUERY);
  }

  async getEntitySettings(entityId: string): Promise<Record<string, unknown>> {
    const page = await this.entity.list(
      { page: 1, limit: 1 },
      {
        access: { type: "eq", column: "entityId", value: entityId },
        skipPagination: true,
      },
    );
    const result: Record<string, unknown> = {};
    for (const row of page.data) {
      result[row.key] = this.parseValue(row.value, row.type);
    }
    return result;
  }

  async getSettings(
    entityId: string,
    prefix?: string,
  ): Promise<Record<string, unknown>> {
    const flat = await this.getEntitySettings(entityId);
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(flat)) {
      if (prefix && !key.startsWith(`${prefix}.`)) continue;
      const cleanKey = prefix ? key.slice(prefix.length + 1) : key;
      this.setNestedValue(result, cleanKey, value);
    }

    return result;
  }

  async getSetting(entityId: string, key: string): Promise<unknown> {
    const row = await this.entity.get(
      { entityId, key },
      { access: { type: "eq", column: "entityId", value: entityId } },
    );
    if (!row) return null;
    return this.parseValue(row.value, row.type);
  }

  async setSetting(
    entityId: string,
    key: string,
    value: unknown,
    type: ESettingType = ESettingType.STRING,
    description?: string,
  ): Promise<SettingEntity> {
    const stringValue = this.stringifyValue(value, type);
    const existing = await this.entity.get(
      { entityId, key },
      { access: { type: "eq", column: "entityId", value: entityId } },
    );

    if (existing) {
      return this.entity.update(existing.id, {
        value: stringValue,
        type,
        ...(description !== undefined ? { description } : {}),
      });
    }

    return this.entity.create({
      entityId,
      key,
      value: stringValue,
      type,
      description: description ?? null,
      isPublic: false,
      isEditable: true,
    });
  }

  async saveSettings(
    entityId: string,
    data: Record<string, unknown>,
    prefix = "",
  ): Promise<SettingEntity[]> {
    const batch: Record<string, SettingInput> = {};
    this.processObject(data, batch, prefix);
    const results: SettingEntity[] = [];

    for (const [key, config] of Object.entries(batch)) {
      if (config.clear) {
        await this.deleteSetting(entityId, key);
        continue;
      }
      results.push(
        await this.setSetting(
          entityId,
          key,
          config.value,
          config.type ?? ESettingType.STRING,
          config.description,
        ),
      );
    }

    return results;
  }

  async deleteSetting(entityId: string, key: string): Promise<boolean> {
    const row = await this.entity.get(
      { entityId, key },
      { access: { type: "eq", column: "entityId", value: entityId } },
    );
    if (!row) return false;
    await this.entity.hardDelete(row.id);
    return true;
  }

  private processObject(
    obj: Record<string, unknown>,
    batch: Record<string, SettingInput>,
    prefix: string,
    parentKey = "",
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) continue;

      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      const settingKey = prefix ? `${prefix}.${fullKey}` : fullKey;

      // null clears the stored key (e.g. timezone → device default).
      if (value === null) {
        batch[settingKey] = { value: null, clear: true };
        continue;
      }

      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        this.processObject(
          value as Record<string, unknown>,
          batch,
          prefix,
          fullKey,
        );
        continue;
      }

      batch[settingKey] = {
        value,
        type: this.detectValueType(value),
        description: `Setting: ${fullKey}`,
      };
    }
  }

  private detectValueType(value: unknown): ESettingType {
    if (typeof value === "boolean") return ESettingType.BOOLEAN;
    if (typeof value === "number") return ESettingType.NUMBER;
    if (Array.isArray(value)) return ESettingType.ARRAY;
    if (typeof value === "object" && value !== null) return ESettingType.JSON;
    return ESettingType.STRING;
  }

  private setNestedValue(
    obj: Record<string, unknown>,
    path: string,
    value: unknown,
  ): void {
    const keys = path.split(".");
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]!;
      if (!(key in current) || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]!] = value;
  }

  private parseValue(value: string, type: ESettingType): unknown {
    switch (type) {
      case ESettingType.NUMBER:
        return Number.parseFloat(value);
      case ESettingType.BOOLEAN:
        return value === "true";
      case ESettingType.JSON:
      case ESettingType.ARRAY:
        return JSON.parse(value) as unknown;
      default:
        return value;
    }
  }

  private stringifyValue(value: unknown, type: ESettingType): string {
    switch (type) {
      case ESettingType.JSON:
      case ESettingType.ARRAY:
        return JSON.stringify(value);
      default:
        return String(value);
    }
  }
}

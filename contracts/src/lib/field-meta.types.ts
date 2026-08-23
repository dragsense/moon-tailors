/**
 * UI field types for auto-generated forms from Zod schemas.
 */
export type TFieldUiType =
  | "text"
  | "email"
  | "password"
  | "textarea"
  | "number"
  | "switch"
  | "select"
  | "date"
  | "hidden";

/**
 * List-query filter kind.
 * Declared on Zod `field()` meta; server builds FilterSpec via `filtersFromListSchema`.
 */
export type TQueryFilterKind =
  | "eq"
  | "in"
  | "eqi"
  | "between"
  | "bool";

export type TListFilterSpec = {
  type: TQueryFilterKind;
  /**
   * DB column or nested path; defaults to the query param / schema key.
   * Nested OK: `sender.firstName`, `participants.user.email`.
   */
  column: string;
};

export interface IFieldOption {
  label: string;
  value: string;
}

export interface IFieldMeta {
  type: TFieldUiType;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: IFieldOption[];
  order?: number;
  /**
   * How this list-query field filters on the server.
   * Omit or `false` → not a server filter (UI-only / ignored by buildEntityQuery).
   */
  filter?: TQueryFilterKind | false;
  /**
   * Override DB column / nested path when it differs from the query key.
   * Example: `filterColumn: "sender.firstName"`.
   */
  filterColumn?: string;
}

export interface IFormFieldConfig {
  name: string;
  meta: IFieldMeta;
  schema: import("zod").ZodTypeAny;
}

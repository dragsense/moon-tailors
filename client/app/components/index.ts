/**
 * App-wide UI packages (not feature-domain UI).
 *
 * ```txt
 * components/
 *   ui/         shadcn primitives
 *   layout-ui/  modal, list, card, confirm, …
 *   form-ui/    SchemaForm, FieldControl
 * ```
 *
 * Prefer subpackage imports:
 *   import { Button } from "~/components/ui"
 *   import { Modal, List } from "~/components/layout-ui"
 *   import { SchemaForm } from "~/components/form-ui"
 */
export * from "./ui";
export * from "./layout-ui";
export * from "./form-ui";

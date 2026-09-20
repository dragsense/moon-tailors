import type { z } from "zod";
import {
  paginatedVendorsSchema,
  vendorPaymentSchema,
  vendorPurchaseItemSchema,
  vendorPurchaseSchema,
  vendorSchema,
  vendorSlipSchema,
  vendorTotalsSchema,
} from "./schema.js";

export interface IVendor extends z.infer<typeof vendorSchema> {}

export interface IVendorTotals extends z.infer<typeof vendorTotalsSchema> {}

export interface IVendorPurchase extends z.infer<typeof vendorPurchaseSchema> {}

export interface IVendorPurchaseItem
  extends z.infer<typeof vendorPurchaseItemSchema> {}

export interface IVendorPayment extends z.infer<typeof vendorPaymentSchema> {}

export interface IVendorSlip extends z.infer<typeof vendorSlipSchema> {}

export interface IPaginatedVendors
  extends z.infer<typeof paginatedVendorsSchema> {}

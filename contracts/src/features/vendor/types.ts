import type { z } from "zod";
import {
  createVendorPaymentSchema,
  createVendorPurchaseSchema,
  createVendorSchema,
  updateVendorSchema,
  vendorListQuerySchema,
  vendorPurchaseItemInputSchema,
} from "./schema.js";

export type TCreateVendorData = z.infer<typeof createVendorSchema>;
export type TUpdateVendorData = z.infer<typeof updateVendorSchema>;
export type TVendorListQuery = z.infer<typeof vendorListQuerySchema>;
export type TVendorPurchaseItemInput = z.infer<
  typeof vendorPurchaseItemInputSchema
>;
export type TCreateVendorPurchaseData = z.infer<
  typeof createVendorPurchaseSchema
>;
export type TCreateVendorPaymentData = z.infer<
  typeof createVendorPaymentSchema
>;

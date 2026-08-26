import type {
  IMeasurement,
  IOrder,
  TUpdateMeasurementData,
} from "@moon-tailors/contracts";
import { apiRequest, BaseService, buildApiUrl } from "~/lib/api";

/**
 * Measurements API:
 * - GET /measurements/:id
 * - PATCH /measurements/:id
 * - PATCH /measurements/customers/:customerId
 * - POST /orders/:id/apply-measurements-to-default
 */
class MeasurementsService extends BaseService<
  IMeasurement,
  TUpdateMeasurementData,
  TUpdateMeasurementData
> {
  constructor() {
    super("/measurements");
  }

  /** GET /measurements/:id */
  getOne(id: string) {
    return this.getSingle<IMeasurement>(id);
  }

  /** PATCH /measurements/:id */
  update(id: string, body: TUpdateMeasurementData) {
    return this.patch<IMeasurement>(id)(body);
  }

  /** PATCH /measurements/customers/:customerId */
  upsertByCustomer(customerId: string, body: TUpdateMeasurementData) {
    return this.patch<IMeasurement>()(
      body,
      undefined,
      `/customers/${customerId}`,
    );
  }

  /** POST /orders/:orderId/apply-measurements-to-default */
  applyOrderToDefault(orderId: string) {
    const url = buildApiUrl("/orders", {
      customPath: `/${orderId}/apply-measurements-to-default`,
    });
    return apiRequest<IOrder>(url, "POST", {});
  }
}

export const measurementsService = new MeasurementsService();

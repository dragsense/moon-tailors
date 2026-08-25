import type {
  IGarmentType,
  IMessageResponse,
  IPaginatedResponse,
  TCreateGarmentTypeData,
  TGarmentTypeListQuery,
  TUpdateGarmentTypeData,
} from "@moon-tailors/contracts";
import { BaseService } from "~/lib/api";

class GarmentTypesService extends BaseService<
  IGarmentType,
  TCreateGarmentTypeData,
  TUpdateGarmentTypeData
> {
  constructor() {
    super("/garment-types");
  }

  list(query: Partial<TGarmentTypeListQuery> = {}) {
    const { page = 1, limit = 100, ...rest } = query;
    return this.get<IGarmentType>({
      page,
      limit,
      ...rest,
    }) as Promise<IPaginatedResponse<IGarmentType>>;
  }

  getOne(id: string) {
    return this.getSingle(id);
  }

  create(body: TCreateGarmentTypeData) {
    return this.post(body);
  }

  update(id: string, body: TUpdateGarmentTypeData) {
    return this.patch(id)(body);
  }

  remove(id: string) {
    return this.delete(id) as Promise<IMessageResponse>;
  }
}

export const garmentTypesService = new GarmentTypesService();

import type { EGarmentAudience, IGarmentType } from "@moon-tailors/contracts";
import { useApiQueryKeyed } from "~/hooks";
import { garmentTypesService } from "./api";
import { garmentTypeKeys } from "./query-keys";

export function useGarmentTypes(audience?: EGarmentAudience) {
  const query = useApiQueryKeyed(
    garmentTypeKeys.catalog(audience),
    async () => {
      const page = await garmentTypesService.list({
        page: 1,
        limit: 100,
        audience,
      });
      return page.data;
    },
  );

  return {
    types: (query.data ?? []) as IGarmentType[],
    isPending: query.isPending,
  };
}

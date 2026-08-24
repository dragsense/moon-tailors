import {
  createCustomerSchema,
  type TCreateCustomerData,
} from "@moon-tailors/contracts";
import { Modal } from "~/components/layout-ui";
import { SchemaForm } from "~/components/form-ui";
import type { MutationOpComponentProps } from "~/ops";

export function CreateCustomerModal({
  isOpen,
  isError,
  error,
  close,
  submit,
  isPending,
}: MutationOpComponentProps) {
  if (!isOpen) return null;

  return (
    <Modal
      title="New customer"
      description="Name and phone are enough to start. Measurements can be added on the profile."
      onClose={close}
      error={
        isError
          ? error instanceof Error
            ? error.message
            : "Create failed"
          : null
      }
    >
      <SchemaForm
        schema={createCustomerSchema}
        submitLabel={isPending ? "Saving…" : "Create customer"}
        onSubmit={async (values) => {
          await submit(values as TCreateCustomerData);
          close();
        }}
      />
    </Modal>
  );
}

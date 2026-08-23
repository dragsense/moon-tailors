import { useState } from "react";
import { createUserSchema, type TUserResponse } from "@template/contracts";
import { Modal } from "~/components/layout-ui";
import { SchemaForm } from "~/components/form-ui";
import type { MutationOpComponentProps } from "~/ops";
import { CredentialModal } from "./credential-modal";

export function CreateUserModal({
  isOpen,
  isError,
  error,
  close,
  submit,
  isPending,
}: MutationOpComponentProps) {
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  if (!isOpen && !credentials) return null;

  return (
    <>
      {isOpen ? (
        <Modal
          title="New user"
          description="Add a person — a temporary password is emailed and shown once."
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
            schema={createUserSchema}
            submitLabel={isPending ? "Saving…" : "Create user"}
            onSubmit={async (values) => {
              const result = (await submit(values)) as TUserResponse | undefined;
              close();
              if (result?.user?.email && result.user.password) {
                setCredentials({
                  email: result.user.email,
                  password: result.user.password,
                });
              }
            }}
          />
        </Modal>
      ) : null}

      <CredentialModal
        open={Boolean(credentials)}
        email={credentials?.email ?? ""}
        password={credentials?.password ?? ""}
        onClose={() => setCredentials(null)}
      />
    </>
  );
}

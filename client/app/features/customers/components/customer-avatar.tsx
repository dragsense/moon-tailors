import type { ICustomer } from "@moon-tailors/contracts";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";

export function customerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

export type CustomerAvatarProps = {
  customer: Pick<ICustomer, "name">;
  className?: string;
  size?: "default" | "sm" | "lg";
};

export function CustomerAvatar({
  customer,
  className,
  size = "lg",
}: CustomerAvatarProps) {
  return (
    <Avatar size={size} className={cn("overflow-hidden", className)}>
      <AvatarFallback>{customerInitials(customer.name)}</AvatarFallback>
    </Avatar>
  );
}

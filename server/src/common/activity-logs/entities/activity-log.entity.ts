import { Column, Entity } from "typeorm";
import { EActivityStatus, EActivityType } from "@moon-tailors/contracts";
import { GeneralBaseEntity } from "../../entities";

@Entity("activity_logs")
export class ActivityLogEntity extends GeneralBaseEntity {
  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 32, default: EActivityType.READ })
  type!: EActivityType;

  @Column({ type: "varchar", length: 32, default: EActivityStatus.SUCCESS })
  status!: EActivityStatus;

  @Column({ type: "varchar", length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: "text", nullable: true })
  userAgent!: string | null;

  @Column({ type: "varchar", length: 512, nullable: true })
  endpoint!: string | null;

  @Column({ type: "varchar", length: 10, nullable: true })
  method!: string | null;

  @Column({ type: "int", nullable: true })
  statusCode!: number | null;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: "text", nullable: true })
  errorMessage!: string | null;

  @Column({ type: "uuid", nullable: true })
  userId!: string | null;

  @Column({ type: "uuid", nullable: true })
  businessId!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  module!: string | null;
}

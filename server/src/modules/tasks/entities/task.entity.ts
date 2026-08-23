import { Column, Entity, Index } from "typeorm";
import { ETaskStatus } from "@template/contracts";
import { GeneralBaseEntity } from "../../../common/entities";

@Entity("tasks")
export class TaskEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid", nullable: true })
  tenantId!: string | null;

  @Column({ type: "varchar", length: 20 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 32, default: ETaskStatus.TODO })
  status!: ETaskStatus;

  @Column({ type: "int", default: 0 })
  progress!: number;

  @Index()
  @Column({ type: "uuid", nullable: true })
  assigneeId!: string | null;
}

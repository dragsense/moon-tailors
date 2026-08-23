import {
  Column,
  Entity,
  Index,
} from "typeorm";
import { EAiProcessorType } from "@template/contracts";
import { GeneralBaseEntity } from "../../entities";

@Entity("ai_processors")
export class AiProcessorEntity extends GeneralBaseEntity {
  @Index({ unique: true })
  @Column({ type: "varchar", length: 64 })
  type!: EAiProcessorType;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "boolean", default: false })
  enabled!: boolean;

  @Column({ type: "text", nullable: true })
  description!: string | null;
}

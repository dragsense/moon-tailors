import { Column, Entity, Index, OneToMany } from "typeorm";
import { EStaffStatus } from "@moon-tailors/contracts";
import { GeneralBaseEntity } from "../../../common/entities";
import { StaffEmploymentEntity } from "./staff-employment.entity";

/** Plain staff info. Join date, pay type and salary live in `employments`. */
@Entity("staff")
export class StaffEntity extends GeneralBaseEntity {
  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 40 })
  phone!: string;

  @Column({ type: "varchar", length: 80, nullable: true })
  role!: string | null;

  @Index()
  @Column({ type: "varchar", length: 16, default: EStaffStatus.ACTIVE })
  status!: EStaffStatus;

  @Column({ type: "varchar", length: 255, nullable: true })
  address!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @OneToMany(() => StaffEmploymentEntity, (employment) => employment.staff)
  employments?: StaffEmploymentEntity[];
}

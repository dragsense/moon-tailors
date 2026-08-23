import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import {
  EBorderRadius,
  EDensity,
  ESidebarStyle,
} from "@template/contracts";
import { GeneralBaseEntity } from "../../../entities";
import { FileUploadEntity } from "../../../file-upload/entities";
import { BusinessEntity } from "./business.entity";

@Entity("business_themes")
@Index(["businessId"], { unique: true })
export class BusinessThemeEntity extends GeneralBaseEntity {
  @Column({ type: "uuid" })
  businessId!: string;

  @ManyToOne(() => BusinessEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business?: BusinessEntity;

  @Column({ type: "uuid", nullable: true })
  logoLightId!: string | null;

  @ManyToOne(() => FileUploadEntity, {
    nullable: true,
    onDelete: "SET NULL",
    eager: true,
  })
  @JoinColumn({ name: "logoLightId" })
  logoLight?: FileUploadEntity | null;

  @Column({ type: "uuid", nullable: true })
  logoDarkId!: string | null;

  @ManyToOne(() => FileUploadEntity, {
    nullable: true,
    onDelete: "SET NULL",
    eager: true,
  })
  @JoinColumn({ name: "logoDarkId" })
  logoDark?: FileUploadEntity | null;

  @Column({ type: "uuid", nullable: true })
  faviconId!: string | null;

  @ManyToOne(() => FileUploadEntity, {
    nullable: true,
    onDelete: "SET NULL",
    eager: true,
  })
  @JoinColumn({ name: "faviconId" })
  favicon?: FileUploadEntity | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  primaryColorLight!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  primaryColorDark!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  secondaryColorLight!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  secondaryColorDark!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  accentColorLight!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  accentColorDark!: string | null;

  @Column({
    type: "varchar",
    length: 20,
    default: EBorderRadius.MD,
  })
  borderRadius!: EBorderRadius;

  @Column({ type: "varchar", length: 100, nullable: true })
  fontFamily!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  fontUrl!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  title!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  loginTagline!: string | null;

  @Column({
    type: "varchar",
    length: 20,
    default: EDensity.COMFORTABLE,
  })
  density!: EDensity;

  @Column({
    type: "varchar",
    length: 20,
    default: ESidebarStyle.ICON,
  })
  sidebarStyle!: ESidebarStyle;
}

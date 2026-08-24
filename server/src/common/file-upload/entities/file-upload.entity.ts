import { Column, Entity, Index } from "typeorm";
import { EFileType } from "@moon-tailors/contracts";
import { GeneralBaseEntity } from "../../entities";

@Entity("uploaded_files")
export class FileUploadEntity extends GeneralBaseEntity {
  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  originalName!: string;

  @Column({ type: "varchar", length: 255, default: "" })
  mimeType!: string;

  @Column({ type: "varchar", length: 32, default: EFileType.OTHER })
  type!: EFileType;

  @Column({ type: "bigint", default: 0 })
  size!: number;

  @Column({ type: "varchar", length: 512, nullable: true })
  path!: string | null;

  @Index()
  @Column({ type: "varchar", length: 80, default: "general" })
  folder!: string;

  @Column({ type: "varchar", length: 1024 })
  url!: string;
}

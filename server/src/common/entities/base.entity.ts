import {
  BaseEntity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * Shared columns for all persisted entities.
 * Soft-delete is manual via `deletedAt` — not TypeORM `@DeleteDateColumn`.
 */
export abstract class GeneralBaseEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @Column({ type: "uuid", nullable: true })
  createdByUserId!: string | null;

  @Column({ type: "uuid", nullable: true })
  updatedByUserId!: string | null;

  @Column({ type: "uuid", nullable: true })
  deletedByUserId!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  deletedAt!: Date | null;
}

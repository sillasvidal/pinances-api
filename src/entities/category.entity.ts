import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  icon: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string;

  @Column({ type: 'enum', enum: ['expense', 'income', 'both'], default: 'expense' })
  type: 'expense' | 'income' | 'both';

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @ManyToOne('User', 'categories')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ type: 'uuid' })
  user_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true})
  username: string;

  @Column({ nullable: true})
  password: string;

  @Column({ default: 0 })
  user_id_42: number;

  @Column({ default: false })
  is_admin: boolean;

  @Column({ default: '/uploads/default.webp' })
  avatar: string;

  @Column({ nullable: true})
  totp_secret: string;

  @Column({ default: 0, type: 'smallint'})
  prefered_mode: number;

  @Column()
  @CreateDateColumn()
  created_at: Date;

  @Column()
  @UpdateDateColumn()
  updated_at: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}

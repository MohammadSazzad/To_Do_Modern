/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: pg.Pool;

  constructor() {
    const isTest = process.env.NODE_ENV === 'test';
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString && !isTest) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }

    const pool = new pg.Pool({ connectionString: connectionString ?? '' });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: ['error', 'warn'],
    });
    this.pool = pool;
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Database connected successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Database connection failed: ${message}`, stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Database disconnected');
  }
}

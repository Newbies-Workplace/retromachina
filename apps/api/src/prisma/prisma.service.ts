import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "generated/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = new PrismaMariaDb({
      database: process.env.DATABASE_NAME,
      host: process.env.DATABASE_HOST || "127.0.0.1",
      password: process.env.DATABASE_PASSWORD || "retro",
      port: parseInt(process.env.DATABASE_PORT, 10) || 3307,
      user: process.env.DATABASE_USER || "root",
    });
    super({ adapter: pool });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

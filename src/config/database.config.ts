import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? 'capilar_shopping',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    // Activar solo en bases locales y de forma explícita.
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.NODE_ENV === 'development',
    charset: 'utf8mb4',
  }),
);

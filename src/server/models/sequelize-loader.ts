import { Sequelize, Transaction } from 'sequelize';

export const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost/rep_rss',
  { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED, logging: false }
);

export {sequelize as database};

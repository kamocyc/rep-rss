import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(
  'postgres://postgres:postgres@localhost/rep_rss'
);

export {sequelize as database};

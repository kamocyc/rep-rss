import { Sequelize, DataTypes } from 'sequelize';
import { database } from './sequelize-loader';
import { User } from './user';

export const Rss = database.define(
  'Rss',
  {
    rssId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.TEXT,
    },
    maxPubDate: {
      type: DataTypes.DATE,
    }
  }
);

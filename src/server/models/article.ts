import { Sequelize, DataTypes } from 'sequelize';
import { database } from './sequelize-loader';

export const Article = database.define(
  'Article',
  {
    articleId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    rssId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    link: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    title: {
      type: DataTypes.TEXT,
    },
    description: {
      type: DataTypes.TEXT,
    },
    enclosure: {
      type: DataTypes.TEXT,
    },
    point: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    count_twitter: {
      type: DataTypes.INTEGER,
    },
    count_twitter_updated: {
      type: DataTypes.DATE,
    },
    pubDate: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  }
);
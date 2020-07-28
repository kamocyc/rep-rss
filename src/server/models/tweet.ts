import { Sequelize, DataTypes } from 'sequelize';
import { database } from './sequelize-loader';

export const Tweet = database.define(
  'Tweet',
  {
    tweetId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tweetOriginalId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    articleId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    twDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    twScreenName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    twName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    twText: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    twOriginalText: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    twUrl: {
      type: DataTypes.STRING,
    }
  }
);
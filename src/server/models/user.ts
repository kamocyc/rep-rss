import { Sequelize, DataTypes } from 'sequelize';
import { database } from './sequelize-loader';

export const User = database.define(
  'User',
  {
    userId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }
);
import { DataTypes, Model } from 'sequelize';
import { sequelize } from './sequelize-loader';

export default class User extends Model {
  public userId!: string;
  public username!: string;
  public oauthToken!: string | null;
  public oauthTokenSecret!: string | null;
  public rememberToken!: string | null;
}

User.init({
  userId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  oauthToken: {
    type: DataTypes.STRING,
  },
  oauthTokenSecret: {
    type: DataTypes.STRING,
  },
  rememberToken: {
    type: DataTypes.STRING,
  }
},
{
  tableName: "Users",
  modelName: "User",
  sequelize, // passing the `sequelize` instance is required
});
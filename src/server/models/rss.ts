import { DataTypes, Model } from 'sequelize';
import { sequelize } from './sequelize-loader';

export default class Rss extends Model {
  public rssId!: number;
  public url!: string;
  public title!: string;
  public maxPubDate!: Date;
  public updatingLockUntil!: Date;
}

Rss.init({
  rssId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  title: {
    type: DataTypes.TEXT,
  },
  maxPubDate: {
    type: DataTypes.DATE,
  },
  updatingLockUntil: {
    type: DataTypes.DATE,
  }
},
{
  tableName: "Rsses",
  modelName: "Rss",
  sequelize
});

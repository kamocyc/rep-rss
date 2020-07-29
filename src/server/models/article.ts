import { DataTypes, Model } from 'sequelize';
import { sequelize } from './sequelize-loader';

export default class Article extends Model {
  public articleId!: number;
  public rssId!: number;
  public link!: string;
  public title!: string | null;
  public description!: string | null;
  public enclosure!: string | null;
  public point!: number;
  public count_twitter!: number | null;
  public count_twitter_updated!: Date | null;
  public pubDate!: Date;
}

Article.init({
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
},
{
  sequelize
});
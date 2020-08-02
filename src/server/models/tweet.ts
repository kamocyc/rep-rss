import { DataTypes, Model } from 'sequelize';
import { sequelize } from './sequelize-loader';

export default class Tweet extends Model {
  public tweetId!: number;
  public tweetOriginalId!: string;
  public articleId!: number;
  public twDate!: Date;
  public twScreenName!: string;
  public twProfileImage!: string;
  public twName!: string;
  public twText!: string;
  public twUrl!: string | null;
  public twOriginalText!: string;
}

Tweet.init(
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
  twProfileImage: {
    type: DataTypes.STRING,
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
},{
  tableName: "Tweets",
  modelName: "Tweet",
  sequelize
});

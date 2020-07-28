
// @ts-ignore
import Parser, { mockRssParser } from 'rss-parser';
import { rssArticleJsonToBe, rssArticleJson, tweetJson, tweetJsonToBe } from './data';
import { updateRss, convertTweet, getTwitterReputation, getArticles } from '../../src/server/fetch_rss';

import { database } from '../../src/server/models/sequelize-loader';
import { User } from '../../src/server/models/user';
import { Rss } from '../../src/server/models/rss';
import { Article } from '../../src/server/models/article';
import { Tweet } from '../../src/server/models/tweet';

jest.mock('rss-parser');

beforeEach(async () => { 
  (Parser as any).mockClear();
  mockRssParser.mockClear();
  
  await User.destroy(   {truncate: true, cascade: true, restartIdentity: true});
  await Rss.destroy(    {truncate: true, cascade: true, restartIdentity: true});
  await Article.destroy({truncate: true, cascade: true, restartIdentity: true});
  await Tweet.destroy(  {truncate: true, cascade: true, restartIdentity: true});

  await User.create({
    userId: "fooUserId",
    username: "fooUserName"
  });
  
  await Rss.create({
    rssId: 1,
    url: "http://example.com",
    title: "example Rss",
    maxPubDate: null
  });
});

const twClient = {
  get: async () => {
    return {
      statuses: [
        tweetJson
      ]
    };
  }
};

function equalTweet(res: any, tobe: any) {
  expect(res.twDate).toStrictEqual(tobe.twDate);
  expect(res.twName).toBe(tobe.twName);
  expect(res.twScreenName).toBe(tobe.twScreenName);
  expect(res.twText).toBe(tobe.twText);
  expect(res.twUrl).toBe(tobe.twUrl);
  expect(res.tweetOriginalId).toBe(tobe.tweetOriginalId);
}

describe("update regular to database", () => {
  test("update", async () => {
    const rss = await Rss.findAll({where: {rssId: 1}});

    const {title, maxPubDate} = await updateRss(rss[0] as any, twClient as any);
    
    expect(title).toBe("Hacker News: Newest");
    expect(maxPubDate).toStrictEqual(new Date("2020-07-26T21:38:03.000Z"));
    
    //article
    const articles = await Article.findAll();
    expect(articles.length).toBe(2);
    const article_2 = await Article.findAll({ where: {title: "Cracking down on research fraud"}});
    expect(article_2.length).toBe(1);
    const ar = (article_2[0] as any);
    
    expect(ar.rssId).toBe(1);
    expect(ar.link).toBe("https://undark.org/2020/07/23/cracking-down-on-research-fraud");
    expect(ar.title).toBe("Cracking down on research fraud");
    expect(ar.description).toBe("Article URL: https://undark.org/2020/07/23/cracking-down-on-research-fraud Comments URL: https://news.ycombinator.com/item?id=23960387 Points: 256 # Comments: 150");
    expect(ar.enclosure).toBe(null);
    expect(ar.pubDate).toStrictEqual(new Date("2020-07-26T21:38:03.000Z"));
    expect(ar.point).toBe(0);
    expect(ar.count_twitter).toBe(1);
    
    //tweet
    const tweets = await Tweet.findAll();
    expect(tweets.length).toBe(2);
    const tweet_2 = await Tweet.findAll({ where: { articleId: ar.articleId }});
    const tw = (tweet_2[0] as any);
    
    equalTweet(tw, tweetJsonToBe);
  });
});

describe("tweet_get", () => {
  test("convertTweetの結果が正しい", () => {
    const res = convertTweet(tweetJson);
    
    equalTweet(res, tweetJsonToBe);
  });
  
  
  test("getTwitterReputation", async () => {
    const {tweets, tweetCount} = await getTwitterReputation(twClient as any, "foo");
    
    expect(tweetCount).toBe(1);
    
    const res = tweets[0];
    equalTweet(res, tweetJsonToBe);
  });
  
  test("getArticles", async () => {
    const {articles, title} = await getArticles("foo");
    
    expect(articles).toStrictEqual(rssArticleJsonToBe);
    expect(title).toBe("Hacker News: Newest");
  });
});

//NEED THIS WHEN TEST!!!
afterAll(async () => {
  await database.close();
});

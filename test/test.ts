
// @ts-ignore
import Parser, { mockRssParser } from 'rss-parser';
import { rssArticleJsonToBe, rssArticleJson, tweetJson, tweetJsonToBe } from './data';
import { database, sequelize } from '../src/server/models/sequelize-loader';
import { updateRss, convertTweet, getTwitterReputation, getArticles } from '../src/server/fetch_rss';

import { User } from '../src/server/models/user';
import { Rss } from '../src/server/models/rss';
import { Article } from '../src/server/models/article';
import { Tweet } from '../src/server/models/tweet';

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

//NEED THIS WHEN TEST!!!
afterAll(async () => {
  await database.close();
})

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
  expect(res.tweetId).toBe(tobe.tweetId);
}

describe("update regular to database", () => {
  test("update", async () => {
    const rss = await Rss.findAll({where: {rssId: 1}});

    const {title, maxPubDate} = await updateRss(rss[0] as any, twClient as any);
    
    expect(title).toBe("Hacker News: Newest");
    expect(maxPubDate).toStrictEqual(new Date("2020-07-26T21:38:03.000Z"));
    const articles = await Article.findAll();
    expect(articles.length).toBe(2);
    // expect(articles[1]).toStrictEqual({
    //   articleId: 2,
    //   rssId: 1,
    //   link: "https://undark.org/2020/07/23/cracking-down-on-research-fraud",
    //   title: "Cracking down on research fraud",
    //   description: "Article URL: https://undark.org/2020/07/23/cracking-down-on-research-fraud Comments URL: https://news.ycombinator.com/item?id=23960387 Points: 256 # Comments: 150",
    //   enclosure: null,
    //   pubDate: new Date("2020-07-26T21:38:03.000Z"),
    //   point: 0,
    //   count_twitter: 0,
    //   count_twitter_updated: 0
    // });
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

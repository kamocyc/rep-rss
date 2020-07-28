
// @ts-ignore
import Parser, { mockRssParser } from 'rss-parser';
import request from 'supertest';

import { app } from '../../src/server/server_app';

import { database } from '../../src/server/models/sequelize-loader';

import { User } from '../../src/server/models/user';
import { Rss } from '../../src/server/models/rss';
import { Article } from '../../src/server/models/article';
import { Tweet } from '../../src/server/models/tweet';

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

describe('article list', () => {
  test("/api/get_list", (done) => {
    //set up
    Article.create({
      aritcleId: 1,
      rssId: 1,
      link: "http://example.com/a1",
      title: "foo article",
      point: 10,
      pubDate: new Date("2020-01-01"),
    }).then(() => {
      request(app)
      .get("/api/get_list")
      .expect(200, { articles: [{
        articleId: 1,
        link: "http://example.com/a1",
        title: "foo article",
        point: 10,
      }] }, done);
    });
  });
  
  test("/api/comment_list", (done) => {
    Promise.all([
      Article.create({
        aritcleId: 1,
        rssId: 1,
        link: "http://example.com/a1",
        title: "foo article",
        point: 10,
        pubDate: new Date("2020-01-01"),
      }),
      Article.create({
        aritcleId: 2,
        rssId: 1,
        link: "http://example.com/a2",
        title: "bar article",
        point: 16,
        pubDate: new Date("2020-01-02"),
      }),
    ]).then(() => {
      Promise.all(
        [Tweet.create({
          tweetId: 2,
          tweetOriginalId: "123456789",
          articleId: 1,
          twDate: new Date("2020-01-01"),
          twScreenName: "aa",
          twName: "bb",
          twText: "cc",
          twUrl: "dd",
        }),
        Tweet.create({
          tweetId: 3,
          tweetOriginalId: "123456789",
          articleId: 2,
          twDate: new Date("2020-01-02"),
          twScreenName: "aa1",
          twName: "bb1",
          twText: "cc1",
          twUrl: "dd1",
        })]
      ).then(() => {
        request(app)
        .get("/api/comment_list?articleId=" + 1)
        .expect(200, {
          comments: [{
            commentId: 'tw_123456789',
            articleId: 1,
            date: '2020-01-01T00:00:00.000Z',
            name: "aa",
            text: "cc",
            twUrl: "dd",
          }]
        }, done);
      });
    })
  });
});

//NEED THIS WHEN TEST!!!
afterAll(async () => {
  await database.close();
});

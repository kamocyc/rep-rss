
import User from '../../src/server/models/user';
import Rss from '../../src/server/models/rss';
import Article from '../../src/server/models/article';
import Tweet from '../../src/server/models/tweet';
import { database } from '../../src/server/models/sequelize-loader';

const users = [
  {
    userId: "kamocyc",
    username: "Kamocyc"
  },
  {
    userId: "takeshi",
    username: "Takeshi"
  },
];

const rsses = [
  {
    rssId: 1,
    url: "https://kamocyc.hatenablog.com/rss",
    title: null,
    maxPubDate: null
  },
  {
    rssId: 2,
    url: "https://hnrss.org/newest?points=100&count=2",
    title: "Hacker News: Newest",
    maxPubDate: new Date('Mon, 27 Jul 2020 12:58:32 +0000')
  },
  {
    rssId: 3,
    url: "https://hnrss.org/newest?points=200&count=3",
    title: "Hacker News: Newest",
    maxPubDate: new Date('Mon, 27 Jul 2020 12:59:34 +0000')
  }
];

const articles = [
  {
    aritcleId: 1,
    rssId: 2,
    link: "https://plausible.io/blog/open-source-funding",
    title: "AHow to pay your rent with your open source project",
    point: 24,
    pubDate: new Date("Mon, 27 Jul 2020 08:27:44 +0000"),
  },
  {
    aritcleId: 2,
    rssId: 3,
    link: "https://www.pressherald.com/2020/07/21/first-class-and-priority-mail-delayed-in-favor-of-amazon-parcels-according-to-portland-letter-carriers/",
    title: "Amazon gets priority while mail gets delayed, say US letter carriers",
    point: 10,
    pubDate: new Date("Mon, 27 Jul 2020 07:36:09 +0000"),
  },
  {
    aritcleId: 3,
    rssId: 3,
    link: "https://www.accc.gov.au/media-release/accc-alleges-google-misled-consumers-about-expanded-use-of-personal-data",
    title: "ACCC alleges Google misled consumers about expanded use of personal data",
    point: 14,
    pubDate: new Date("Mon, 27 Jul 2020 02:58:33 +0000"),
  },
];

const tweets = [
  {
    tweetId: 1,
    tweetOriginalId: "123456789",
    articleId: 1,
    twDate: new Date("2020-01-01"),
    twScreenName: "aa",
    twName: "bb",
    twText: "cc",
    twUrl: "dd",
  },
  {
    tweetId: 2,
    tweetOriginalId: "993456789",
    articleId: 1,
    twDate: new Date("2020-01-02"),
    twScreenName: "aa1",
    twName: "bb1",
    twText: "cc1",
    twUrl: "dd1",
  },
  {
    tweetId: 3,
    tweetOriginalId: "883456789",
    articleId: 3,
    twDate: new Date("2020-01-03"),
    twScreenName: "aa2",
    twName: "bb2",
    twText: "cc2",
    twUrl: "dd2",
  }
];

export async function seed() {
  await User.destroy(   {truncate: true, cascade: true, restartIdentity: true});
  await Rss.destroy(    {truncate: true, cascade: true, restartIdentity: true});
  await Article.destroy({truncate: true, cascade: true, restartIdentity: true});
  await Tweet.destroy(  {truncate: true, cascade: true, restartIdentity: true});
  await User.bulkCreate(users);
  await Rss.bulkCreate(rsses);
  await Article.bulkCreate(articles);
  await Tweet.bulkCreate(tweets);
}


describe("update regular to database", () => {
  test("update", async () => {
    // await seed();
    expect(1).toBe(1);
  });
});

//NEED THIS WHEN TEST!!!
afterAll(async () => {
  await database.close();
});

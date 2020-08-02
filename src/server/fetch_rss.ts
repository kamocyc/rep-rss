import Parser from 'rss-parser';
import { Op } from 'sequelize';
import striptags from 'striptags';
import Twitter from 'twitter-lite';
import { decryptToken, flatten, subtractDays, subtractMinutes } from './common';
import Article from './models/article';
import Rss from './models/rss';
import Tweet from './models/tweet';
import User from './models/user';
import { ProcessTweetsMain, TweetType } from './process_tweet';
import { consumerKey, consumerSecret } from './secure_token';
import { QuerySetting, searchAllTweets, SearchApiStatus } from './twitter_api';
import { sequelize } from './models/sequelize-loader';
import { Transaction } from 'sequelize';
import { getHatenaBookmark } from './hatena_bookmark_api';

//articleの最大長
const ARTICLE_BODY_MAX = 255;
//1記事あたりのAPI使用回数上限
const MAX_API_COUNT = 20;

const rssParser = new Parser();

export interface UserToken {
  consumer_key: string;
  consumer_secret: string;
  access_token_key: string;
  access_token_secret: string;
}

interface ArticleType {
  link: string;
  title?: string;
  description?: string;
  enclosure?: string;
  pubDate: Date;
}

type RssType = {
  rssId: number,
  url: string,
  maxPubDate: Date 
};

function aggreagateStatuses(statuses: SearchApiStatus[]): SearchApiStatus {
  return statuses.filter(r => r === 'error').length > 0 ? 'error' :
            (statuses.filter(r => r === 'rate_limit').length > 0 ? 'rate_limit' : 'ok')
}

async function getUserAndToken(userId: string, options: any) {
  const user = await User.findByPk(userId, options);
  if(user === null) {
    return {
      status: 'not_logged_in',
    };
  }
  if(user.oauthToken === null || user.oauthTokenSecret === null) {
    // Illegal
    return {
      status: 'not_logged_in',
    };
  }
  
  const userToken: UserToken = {
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
    access_token_key: decryptToken(user.oauthToken),
    access_token_secret: decryptToken(user.oauthTokenSecret),
  };
  
  return { user, userToken, status: 'ok' };
}

export async function updateAll(userId: string): Promise<{
    status: string;
    count: number;
}> {
  
  const userResult = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async (t) => {
    const { user, userToken, status } = await getUserAndToken(userId, {
      include: [
        {
          model: Rss,
          separate: false,
          where: { updatingLockUntil: { [Op.or]: { [Op.is]: null, [Op.lt]: new Date() } } }
        }
      ],
      transaction: t
    });
    
    if(userToken === undefined) {
      return {
        status: status,
        userToken: undefined,
      };
    }
  
    const rssIds = ((user as any).Rsses as Rss[]).map(r => r.rssId);
    await Rss.update({updatingLockUntil: subtractMinutes(new Date(), -15) }, { where: {rssId: { [Op.in]: rssIds } }, transaction: t});
    
    return { user, userToken, status };
  });
  
  if(userResult.userToken === undefined) {
    return {
      status: userResult.status,
      count: 0
    };
  }
  
  const { userToken, user } = userResult;
  
  const twClient = new Twitter(userToken);
  
  const rsses = (user as any).Rsses as Rss[];
  
  const result = await updateRsses(twClient, rsses);
  
  await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async (t) => {
    const rssIds = ((user as any).Rsses as Rss[]).map(r => r.rssId)
    await Rss.update({updatingLockUntil: null}, { where: {rssId: { [Op.in]: rssIds } }, transaction: t});
  });
    
  return result;
}

export async function updateTweetsEntry(userId: string, pointLowerBound: number, sinceDayMinus: number, lastElapsed: number): Promise<{
    status: string;
    count: number;
}> {
  const nowDate = new Date();
  
  //既にある記事で、ポイントが多くて(10以上)、今から1日以内、最後に更新してから30分以上経ったものを更新対象とする。

  const userResult = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async (t) => {
    const { user, userToken } = await getUserAndToken(userId, {
      include: [
        {
          model: Rss,
          separate: false,
          include: [
            {
              model: Article,
              separate: false,
              where: { [Op.and]: [
                { point: { [Op.gte]: pointLowerBound } },
                { pubDate: { [Op.gte]: subtractDays(nowDate, sinceDayMinus) } },
                { count_twitter_updated: { [Op.lt]: subtractMinutes(nowDate, lastElapsed) } },
                { updatingLockUntil: { [Op.or]: { [Op.is]: null, [Op.lt]: new Date() } } }
              ]},
            }
          ]
        }
      ],
      transaction: t
    });
    
    if(userToken === undefined) {
      return undefined;
    }
  
    const articles = flatten(((user as any).Rsses as Rss[]).map(r => (r as any).Articles as Article[]));
    
    //TODO: INが非常に多くなりうるので改善する
    const articleIds = articles.map(a => a.articleId);
    await Article.update({updatingLockUntil: subtractMinutes(new Date(), -15)}, { where: {articleId: { [Op.in]: articleIds } }, transaction: t});
    
    return { user, userToken, articles };
  });

  if(userResult === undefined) {
    return {
      status: 'not_logged_in',
      count: 0
    };
  }
  
  const { userToken, articles } = userResult;
  
  const twClient = new Twitter(userToken);
  
  console.log({UPDATE_ARTICLES: articles});
  
  const result = await updateTweets(twClient, articles);
  
  await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async (t) => {
    const articleIds = articles.map(a => a.articleId);
    await Article.update({updatingLockUntil: null}, { where: {articleId: { [Op.in]: articleIds } }, transaction: t});
  });
  
  return result;
}

async function updateRsses(twClient: Twitter, rsses: Rss[]) {
  const statuses = await Promise.all(rsses.map(async (rss) => {
    // console.log({rss: rss});
    const { title, maxPubDate, status, count } = await updateRss(rss, twClient);
    // console.log({ title, maxPubDate, rssId: rss.rssId });
    
    await Rss.update(
      {
        title: title,
        maxPubDate: maxPubDate
      },
      {
        where: {
          rssId: rss.rssId
        }
      }
    );
    
    return { status, count };
  }));
  
  // console.log({"agg": aggreagateStatuses(statuses.map(s => s.status))});
  
  return {
    status: aggreagateStatuses(statuses.map(s => s.status)),
    count: statuses.reduce((acc, x) => acc + x.count, 0)
  }
}

async function updateTweets(twClient: Twitter, articles: Article[]) {
  const updateDate = new Date();
  
  const results = await Promise.all(articles.map(async (article) => {
    const qSet: QuerySetting = {
      queryString: article.link,
      since: article.count_twitter_updated === null ? undefined : article.count_twitter_updated,
      maxApiCount: MAX_API_COUNT,
    };
    
    const {tweets, tweetCount, status} = await getTwitterReputation(twClient, qSet, article.title ?? "{{DUMMY}}");
    
    //insert
    const tweetsToInsert = tweets.map(t => ({...t, articleId: article.articleId}));
    
    await Tweet.bulkCreate(tweetsToInsert);
    
    //tweet数を更新
    //pointはいったん単純なtweet countにする
    await Article.update(
      {
        count_twitter_updated: updateDate,
        count_twitter: tweetCount + (article.count_twitter === null ? 0 : article.count_twitter),
        point: tweetCount + (article.count_twitter === null ? 0 : article.count_twitter),
      }, {
        where: {
          articleId: article.articleId
        }
      });
    
    return { tweetCount, status };
  }));
  
  return {
    status: aggreagateStatuses(results.map(r => r.status)),
    count: results.reduce((acc, x) => acc + x.tweetCount, 0)
  };
}

//TODO: tweet検索でのsinceを実装
export async function updateRss(rss: RssType, twClient: Twitter): Promise<{
  title: string;
  maxPubDate: Date;
  status: SearchApiStatus;
  count: number;
}> {
  //キューに貯めるとかしたほうがいい？ => しかし、実装が大変。。。いったん、何も考えずに実装！
  //
  const {title, maxPubDate, createdArticles} = await updateArticles(rss);
  const updateDate = new Date();
  
  const results = await Promise.all(createdArticles.map(async (article) => {
    try {
      const qSet: QuerySetting = {
        queryString: article.link,
        since: undefined,
        maxApiCount: MAX_API_COUNT,
      };
      
      const {tweets, tweetCount, status} = await getTwitterReputation(twClient, qSet, article.articleTitle);
      
      //insert
      const tweetsToInsert = tweets.map(t => ({...t, articleId: article.articleId}));
      
      await Tweet.bulkCreate(tweetsToInsert);
      
      //tweet数を更新
      //pointはいったん単純なtweet countにする
      await Article.update(
        {
          count_twitter_updated: updateDate,
          count_twitter: tweetCount,
          point: tweetCount,
        }, {
          where: {
            articleId: article.articleId
          }
        });
      
      return { tweetCount, status };
    } catch(error) {
      console.error(error);
      return { tweetCount: -1, status: ('error' as SearchApiStatus) };
    }
  }));
  
  return { title, maxPubDate,
    status: aggreagateStatuses(results.map(r => r.status)),
    count: createdArticles.length
  };
}

export async function getTwitterReputation(twClient: Twitter, qSet: QuerySetting, articleTitle: string): Promise<{ status: SearchApiStatus, tweets: TweetType[], tweetCount: number }> {
  const { status: status1, tweets: tweets } = await searchAllTweets(qSet, twClient);
  
  // console.log({TT: {status, tweets }});
    
  const processed = ProcessTweetsMain(tweets, articleTitle);
  // console.log({processed: processed});
  
  const { status: status2, tweets: hatebu, count: bmCount } = await getHatenaBookmark(qSet);
  
  return {
    status: aggreagateStatuses([status1, status2]),
    tweets: processed.tweets.concat(hatebu),
    tweetCount: processed.tweetCount + bmCount
  };
}

async function updateArticles(rss: RssType): Promise<{
    title: string;
    maxPubDate: Date;
    createdArticles: {
      articleId: number;
      link: string;
      articleTitle: string;
    }[]}> {
  const {articles, title} = await getArticles(rss.url);
  
  // console.log({articles_0: articles.length > 0 ? articles[0] : "", title});
  
  //最終更新日以降のものを追加
  const createdArticles = await Promise.all(articles.filter(a => rss.maxPubDate === undefined || a.pubDate > rss.maxPubDate).map(async function (article) {
    const created = await Article.create({
      rssId: rss.rssId,
      link: article.link,
      title: article.title,
      description: article.description,
      enclosure: article.enclosure,
      point: 0,
      pubDate: article.pubDate
    });
    
    return {articleId: created.articleId, link: article.link, articleTitle: article.title ?? ""};
  }));
  
  let maxPubDate = rss.maxPubDate !== undefined ? rss.maxPubDate : new Date('1980-01-01');
  articles.forEach(a => {
    if(a.pubDate > maxPubDate) {
      maxPubDate = a.pubDate;
    }
  });
  
  return {title: title ?? "", maxPubDate, createdArticles};
}

export async function getArticles(url: string): Promise<{articles: ArticleType[], title?: string}> {
  // console.log({url: url});
  const feed = await rssParser.parseURL(url);
  // console.log(feed);
  // console.log(feed.title);

  if(feed.items) {
    return {
      articles: feed.items.map(item => {
        // console.log(item.title + ':' + item.link);
        let content = item.content !== undefined ? striptags(item.content).replace(/(?:\r\n|\r|\n)/g, " ").trim() : "";
        if(content.length > ARTICLE_BODY_MAX) {
          content = content.substring(0, ARTICLE_BODY_MAX);
        }
        
        // console.log({item: item});
        return {
          link: item.link ?? "",
          title: item.title,
          description: content,
          enclosure: item.enclosure?.url,
          //TODO
          pubDate: item.pubDate !== undefined ? new Date(item.pubDate) : item['dc:date'] !== undefined ? new Date(item['dc:date']) : new Date('1980-01-01')
        };
      }),
      title: feed.title
    };
  }
  
  return {
    articles: [],
    title: feed.title
  };
}

import Parser from 'rss-parser';
import { Op } from 'sequelize';
import striptags from 'striptags';
import Twitter from 'twitter-lite';
import { decryptToken, flatten } from './common';
import Article from './models/article';
import Rss from './models/rss';
import Tweet from './models/tweet';
import User from './models/user';
import { ProcessTweetsMain, TweetType } from './process_tweet';
import { consumerKey, consumerSecret } from './secure_token';
import { QuerySetting, searchAllTweets, SearchApiStatus } from './twitter_api';


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

export async function updateAll(userId: string) {
  const { user, userToken, status } = await getUserAndToken(userId, {
    include: [
      {
        model: Rss,
        separate: false,
      }
    ]
  });
  // console.log({userToken: userToken});
  
  if(userToken === undefined) {
    return {
      status: status
    };
  }
  
  const twClient = new Twitter(userToken);
  
  const rsses = (user as any).Rsses as Rss[];
  
  const result = await updateRsses(twClient, rsses);
  
  return result;
}

function subtractDays(date_: Date, days: number): Date {
  const date = new Date(date_);
  date.setDate(date.getDate() - days);
  return date;
}

function subtractMinutes(date_: Date, minutes: number): Date {
  const date = new Date(date_);
  date.setMinutes(date.getMinutes() - minutes);
  return date;
}

export async function updateTweetsEntry(userId: string, pointLowerBound: number, sinceDayMinus: number, lastElapsed: number) {
  const nowDate = new Date();
  
  //既にある記事で、ポイントが多くて(10以上)、今から1日以内、最後に更新してから30分以上経ったものを更新対象とする。
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
            ]},
          }
        ]
      }
    ]
  });
  
  if(userToken === undefined) {
    return {
      status: status
    };
  }
  
  const twClient = new Twitter(userToken);
  
  const articles = flatten(((user as any).Rsses as Rss[]).map(r => (r as any).Articles as Article[]));
  
  console.log({UPDATE_ARTICLES: articles});
  
  const result = await updateTweets(twClient, articles);
  
  return result;
}

async function updateRsses(twClient: Twitter, rsses: Rss[]) {
  const statuses = await Promise.all(rsses.map(async (rss) => {
    // console.log({rss: rss});
    const { title, maxPubDate, status } = await updateRss(rss, twClient);
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
    
    return { status };
  }));
  
  // console.log({"agg": aggreagateStatuses(statuses.map(s => s.status))});
  
  return aggreagateStatuses(statuses.map(s => s.status));
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
    status: aggreagateStatuses(results.map(r => r.status))
  };
}

//TODO: tweet検索でのsinceを実装
export async function updateRss(rss: RssType, twClient: Twitter): Promise<{
  title: string;
  maxPubDate: Date;
  status: SearchApiStatus
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
    status: aggreagateStatuses(results.map(r => r.status))
  };
}

export async function getTwitterReputation(twClient: Twitter, qSet: QuerySetting, articleTitle: string): Promise<{ status: SearchApiStatus, tweets: TweetType[], tweetCount: number }> {
  const { status, tweets } = await searchAllTweets(qSet, twClient);
  
  console.log({TT: {status, tweets }});
    
  const processed = ProcessTweetsMain(tweets, articleTitle);
  
  console.log({processed: processed});
  
  return {
    status: status,
    tweets: processed.tweets,
    tweetCount: processed.tweetCount
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
        
        return {
          link: item.link ?? "",
          title: item.title,
          description: content,
          enclosure: item.enclosure?.url,
          //TODO
          pubDate: item.pubDate !== undefined ? new Date(item.pubDate) : new Date('1980-01-01')
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

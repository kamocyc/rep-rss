import { Tweet } from './models/tweet';
import { Article } from './models/article';
import { Rss } from './models/rss';
import Parser from 'rss-parser';
import Twitter from 'twitter-lite';
import striptags from 'striptags';

//articleの最大長
const ARTICLE_BODY_MAX = 255;
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

interface TweetType {
  tweetId: string,
  twScreenName: string,
  twName: string,
  twDate: Date,
  twText: string,
  twUrl: string,
}

type RssType = {
  rssId: number,
  url: string,
  maxPubDate: Date 
};

export async function updateAll(userToken: UserToken) {
  console.log("a");
  console.log({userToken: userToken});
  //TODO: ログインと連携させる
  const twClient = new Twitter(userToken);
  console.log("b");
  const rsses: any[] = await Rss.findAll() as any;
  console.log("c");
  await Promise.all(rsses.map(async (rss) => {
    console.log("d");
    console.log({rss: rss});
    const { title, maxPubDate } = await updateRss(rss, twClient);
    console.log({ title, maxPubDate, rssId: rss.rssId });
    
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
  }));
}

export async function updateRss(rss: RssType, twClient: Twitter) {
  //キューに貯めるとかしたほうがいい？ => しかし、実装が大変。。。いったん、何も考えずに実装！
  //
  const {title, maxPubDate, createdArticles} = await updateArticles(rss);
  const updateDate = new Date();
  
  await Promise.all(createdArticles.map(async (article) => {
    try {
      const {tweets, tweetCount} = await getTwitterReputation(twClient, article.link);
    
      console.log({tweets, tweetCount});
      
      //insert
      const tweetsToInsert = tweets.map(t => ({...t, articleId: article.articleId}));
      
      await Tweet.bulkCreate(tweetsToInsert);
      
      //tweet数を更新
      await Article.update(
        {
          count_twitter_updated: updateDate,
          count_twitter: tweetCount
        }, {
          where: {
            articleId: article.articleId
          }
        });
      
      return tweetCount;
    } catch(error) {
      console.error(error);
      return -1;
    }
  }));
  
  return { title, maxPubDate };
}

// function dictToParam(dict: { [key: string]: string }): string {
//   let params = [];
//   for(const [k, v] of Object.entries(dict)) {
//     params.push(k + "=" + v);
//   }
  
//   return '?' + params.join('&');
// }

export function convertTweet(status: any): TweetType {
  return {
    tweetId: status.id_str,
    twScreenName: status.user.screen_name,
    twName: status.user.name,
    twDate: new Date(status.created_at),
    twText: status.text,
    twUrl: status.entities.urls[0].url,
  } as TweetType;  
}

export async function getTwitterReputation(twClient: Twitter, queryString: string): Promise<{tweets: TweetType[], tweetCount: number}> {
  const params = {
    q: queryString,
    // result_type: 'mixed', //
    count: "100",
  };
  
  console.log({ params: params });
  try {
    const results = await twClient.get("search/tweets", params);
    console.log({ results: results });
    const tweets = results.statuses.map((status: any) => convertTweet(status));
    
    //TODO: 検索結果が多い時に複数回取得
    
    return {
      tweets: tweets,
      tweetCount: tweets.length
    };
  } catch (e) {
    console.log({"error": e});
    if ('errors' in e) {
      if(e.errors[0].code == 88) {
        console.log("Rate limit will reset on", new Date(e._headers.get("x-rate-limit-reset") * 1000));
      }
    }
    
    return {
      tweets: [],
      tweetCount: 0
    };
  }
}

async function updateArticles(rss: RssType): Promise<{
    title: string;
    maxPubDate: Date;
    createdArticles: {
      articleId: any;
      link: string;
    }[]}> {
  const {articles, title} = await getArticles(rss.url);
  
  console.log({articles_0: articles.length > 0 ? articles[0] : "", title});
  
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
    
    return {articleId: (created as any).articleId, link: article.link};
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
  console.log({url: url});
  const feed = await rssParser.parseURL(url);
  console.log(feed);
  console.log(feed.title);

  if(feed.items) {
    return {
      articles: feed.items.map(item => {
        console.log(item.title + ':' + item.link);
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

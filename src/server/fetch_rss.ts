import Parser from 'rss-parser';
import striptags from 'striptags';
import { Status as TweetStatus } from 'twitter-d';
import Twitter from 'twitter-lite';
import Article from './models/article';
import Rss from './models/rss';
import Tweet from './models/tweet';
import { ProcessTweetsMain, TweetType } from './process_tweet';

//articleの最大長
const ARTICLE_BODY_MAX = 255;
const rssParser = new Parser();

type TweetObject = {
  statuses: TweetStatus[];  
};

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

export async function updateAll(userToken: UserToken) {
  console.log({userToken: userToken});
  //TODO: ログインと連携させる
  const twClient = new Twitter(userToken);
  const rsses = await Rss.findAll();
  await Promise.all(rsses.map(async (rss) => {
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

//TODO: tweet検索でのsinceを実装
export async function updateRss(rss: RssType, twClient: Twitter) {
  //キューに貯めるとかしたほうがいい？ => しかし、実装が大変。。。いったん、何も考えずに実装！
  //
  const {title, maxPubDate, createdArticles} = await updateArticles(rss);
  const updateDate = new Date();
  
  await Promise.all(createdArticles.map(async (article) => {
    try {
      const {tweets, tweetCount} = await getTwitterReputation(twClient, article.link, article.articleTitle, undefined);
      
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
      
      return tweetCount;
    } catch(error) {
      console.error(error);
      return -1;
    }
  }));
  
  return { title, maxPubDate };
}

function getMin<T, U>(arr: T[], fn: (v: T) => U): T {
  if(arr.length === 0) {
    throw new Error("getMin: should contain more than one element");
  }
  
  let minval = fn(arr[0]);
  let minelm = arr[0]
  for(let i=1; i<arr.length; i++) {
    if(minval > fn(arr[i])) {
      minval = fn(arr[i]);
      minelm = arr[i];
    }
  }
  
  return minelm;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();

  if (month.length < 2) 
    month = '0' + month;
  if (day.length < 2) 
    day = '0' + day;

  return [year, month, day].join('-');
}

async function searchAllTweets(queryString: string, twClient: Twitter,  since: Date | undefined): Promise<TweetStatus[]> {
  let allResults: TweetStatus[] = [];
  
  let minId: string | undefined = undefined;
  
  for (;;) {
    const params: { [k: string]: string } = {
      q: queryString,
      // result_type: 'mixed', //
      count: "100",
      tweet_mode: "extended",
    };
    
    if(minId !== undefined) {
      params.max_id = minId;
    }
    
    if(since !== undefined) {
      params.q = params.q + " since:" + formatDate(since);
    }
    
    const results = (await twClient.get("search/tweets", params)) as TweetObject;
    
    if(results.statuses.length < 100) break;
    
    if(minId !== undefined) {
      //2つ取っている分を消す
      allResults = allResults.concat(results.statuses.filter(r => r.id_str !== minId));
    } else {
      allResults = allResults.concat(results.statuses);
    }
  
    minId = getMin(results.statuses, r => r.id_str).id_str;
  }
  
  return allResults;
}

export async function getTwitterReputation(twClient: Twitter, queryString: string, articleTitle: string, since: Date | undefined): Promise<{tweets: TweetType[], tweetCount: number}> {
  try {
    const results = await searchAllTweets(queryString, twClient, since);
    const processed = ProcessTweetsMain(results, articleTitle);
    
    return {
      tweets: processed.tweets,
      tweetCount: processed.tweetCount
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
      articleId: number;
      link: string;
      articleTitle: string;
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

import { Express } from 'express';
import Article from './models/article';
import Tweet from './models/tweet';

export function registerComment(app: Express, csrfProtection: any) {
  app.get('/api/comment_get',
    csrfProtection,
    async (req, res) => {
      try {
        const article = await Article.findByPk(req.query.articleId as string, { include: Tweet });
        if(article === null) throw new Error("Illegal article id");
        
        const tweets = (article as any).Tweets as Tweet[];
        
        res.json({
          comments: tweets.map((tweet) => ({
            commentId: 'tw_' + tweet.tweetOriginalId,
            articleId: tweet.articleId,
            date: tweet.twDate,
            twProfileImage: tweet.twProfileImage,
            tweetOriginalId: tweet.tweetOriginalId,
            name: tweet.twName,
            twScreenName: tweet.twScreenName,
            text: tweet.twText,
            twUrl: tweet.twUrl,
          })),
          article: {
            point: article.point,
            link: article.link,
            title: article.title,
            articleId: article.articleId,
            count_twitter_updated: article.count_twitter_updated,
            description: article.description,
            pubDate: article.pubDate,
            rssId: article.rssId,
            //calculatedPoint: parseInt(article.getDataValue('calculatedPoint')),
            commentCount: tweets.length,
            article: article,
          }
        });
      } catch (e) {
        console.log(e);
        throw new Error("Illegal article number");
      }
    }
  );
}

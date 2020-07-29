import { Express } from 'express';
import { Op, Sequelize } from 'sequelize';
import { LoginUser, flatten } from './common';
import Article from './models/article';
import Rss from './models/rss';
import User from './models/user';
// import { sequelize, database } from './models/sequelize-loader';

//user rss article 

export function registerArticle(app: Express) {
  app.get('/api/article_get',
    async (req, res) => {
      if(req.isAuthenticated()) {
        const TOP_COUNT = req.query.count ? parseInt(req.query.count as string) : 100;
        
        //理想は、ユーザに紐づくものを出したい
        // @ts-ignore
        const user = await User.findByPk(req.user ? (req.user as LoginUser).id : undefined ,{
          include: [
            {
              model: Rss,
              separate: false,
              include: [
                {
                  model: Article,
                  limit: TOP_COUNT,
                  separate: false,
                  where: { point: { [Op.gt]: 6 } },
                  attributes: {
                    include: [
                      [
                        Sequelize.literal('(extract(epoch from NOW() - "Rsses->Articles"."pubDate") / 60 / 20)'),
                        'calculatedPoint'
                      ],
                      [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM "Tweets" As "Tweets"
                            WHERE "Tweets"."articleId" = "Rsses->Articles"."articleId"
                        )`),
                        'tweetCount'
                      ]
                    ]
                  }
                } 
              ]
            }
          ],
          order: [[Sequelize.literal('("Rsses->Articles"."point" - extract(epoch from NOW() - "Rsses->Articles"."pubDate") / 60 / 20)'), 'DESC']],
        });
        
        if(user === null) {
          res.json({
            'status': 'not_logged_in',
            articles: [],
          });
          return;
        }

        //日次の引き算はinterval型、それを整数に変換するにはextractを使う。
        // const rsses = (await (user as any).getRsses()) as Rss[];
        // const articles = await rsses.getArticles({
        //   limit: TOP_COUNT,
        //   order: [[Sequelize.literal("(point - extract(epoch from NOW() - \"pubDate\") / 60 / 20)"), 'DESC']],
        // }) as Article[];
        
        // console.dir(user, { depth: 10});
        
        const articles = flatten(((user as any).Rsses as Rss[]).map(r => (r as any).Articles as Article[]));
        
        res.json({
          status: 'ok',
          articles: articles.map((article) => ({
            point: article.point,
            link: article.link,
            title: article.title,
            articleId: article.articleId,
            count_twitter_updated: article.count_twitter_updated,
            description: article.description,
            pubDate: article.pubDate,
            rssId: article.rssId,
            calculatedPoint: parseInt(article.getDataValue('calculatedPoint')),
            commentCount: parseInt(article.getDataValue("tweetCount")),
            article: article,
          })),
        });
      } else {
        //ログインしていない
        res.json({
          status: 'not_logged_in',
          articles: []
        });
      }
    }
  );
}

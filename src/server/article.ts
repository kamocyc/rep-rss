import { Express } from 'express';
import { Op, Sequelize } from 'sequelize';
import { LoginUser, flatten, subtractDays } from './common';
import Article from './models/article';
import Rss from './models/rss';
import User from './models/user';
// import { sequelize, database } from './models/sequelize-loader';


export function deleteUnusedArticle(app: Express) {
  app.post('/api/article_clean', async (req, res) => {
    const nowDate = new Date();
    
    await Article.destroy({ where: {
      [Op.or]: [
        {
          [Op.and]: [
            { point: { [Op.lte]: 3 }},
            { pubDate: { [Op.lte]: subtractDays(nowDate, 1) } }
          ]
        },{
          [Op.and]: [
            { pubDate: { [Op.lte]: subtractDays(nowDate, 3) }}
          ]
        }
      ]
    } } );
    
    res.json({status: "ok"});
  });
}

//user rss article 

export function registerArticle(app: Express) {
  app.get('/api/article_get',
    async (req, res) => {
      //これがないと、304 (cached) になって更新されない！
      res.setHeader('Last-Modified', (new Date()).toUTCString());
      
      if(req.isAuthenticated()) {
        const TOP_COUNT = req.query.count ? parseInt(req.query.count as string) : 150;
        
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
                  //TODO: 0ポイントも表示させると、数が多すぎで混じってきてよろしくない。
                  where: { point: { [Op.gte]: 1 } },
                  attributes: {
                    include: [
                      [
                        Sequelize.literal('("Rsses->Articles"."point" - extract(epoch from NOW() - "Rsses->Articles"."pubDate") / 60 / 20)'),
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

import { Express } from 'express';
import { Op, Sequelize } from 'sequelize';
import { flatten, getAuthenticatedUser, LoginUser, subtractDays } from './common';
import Article from './models/article';
import Rss from './models/rss';
import User from './models/user';

export function deleteUnusedArticle(app: Express, csrfProtection: any) {
  app.post('/api/article_clean', csrfProtection, async (req, res) => {
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

export function registerArticle(app: Express, csrfProtection: any) {
  app.get('/api/article_get',
    csrfProtection,
    async (req, res) => {
      //これがないと、304 (cached) になって更新されない！
      res.setHeader('Last-Modified', (new Date()).toUTCString());
      
      const authUser = getAuthenticatedUser(req);
      if(authUser !== undefined) {
        const TOP_COUNT = req.query.count ? parseInt(req.query.count as string) : 150;
        
        const user = await User.findByPk((authUser as LoginUser).id ,{
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
                        //日次の引き算はinterval型、それを整数に変換するにはextractを使う。
                        //24時間で2000減少する数値
                        //1.00529236 = POW(2000,1/(24*60))
                        Sequelize.literal(`("Rsses->Articles"."point" - (CASE WHEN extract(epoch from NOW() - "Rsses->Articles"."pubDate") <= 24 * 60 * 2 * 60 THEN pow(1.00529236, extract(epoch from NOW() - "Rsses->Articles"."pubDate") / 60) ELSE 2100000000 END))`),
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
        });
        
        if(user === null) {
          res.json({
            status: 'not_logged_in',
            articles: [],
          });
          return;
        }

        const articles = flatten(((user as any).Rsses as Rss[]).map(r => (r as any).Articles as Article[]));
        
        if(articles.length === 0) {
          const user_ = await User.findByPk((authUser as LoginUser).id, {
            include: [
              {
                model: Rss,
              }
            ]}
          );
          
          if(((user_ as any).Rsses as Rss[]).length === 0) {
            res.json({
              status: 'no_rss',
              articles: []
            });
            return;
          }
        }
        
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

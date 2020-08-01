import { Express } from 'express';
import { Op, Sequelize } from 'sequelize';
import { LoginUser, flatten, subtractDays } from './common';
import Article from './models/article';
import Rss from './models/rss';
import User from './models/user';
import Tweet from './models/tweet';
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
      
      if(req.isAuthenticated() && req.user) {
        const TOP_COUNT = req.query.count ? parseInt(req.query.count as string) : 150;
        
        const rssArticles = `"${Rss.tableName}->${Article.tableName}"`;
        
        // @ts-ignore
        const user = await User.findByPk((req.user as LoginUser).id ,{
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
                        Sequelize.literal(`(${rssArticles}."point" - extract(epoch from NOW() - ${rssArticles}."pubDate") / 60 / 10)`),
                        'calculatedPoint'
                      ],
                      [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM "${Tweet.tableName}" As "Tweets"
                            WHERE "Tweets"."articleId" = ${rssArticles}."articleId"
                        )`),
                        'tweetCount'
                      ]
                    ]
                  }
                } 
              ]
            }
          ],
          order: [[Sequelize.literal(`(${rssArticles}."point" - extract(epoch from NOW() - ${rssArticles}."pubDate") / 60 / 10)`), 'DESC']],
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
          const user_ = await User.findByPk((req.user as LoginUser).id, {
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

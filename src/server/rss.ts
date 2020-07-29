import { Express } from 'express';
import { LoginUser } from './common';
import Rss from './models/rss';
import User from './models/user';

export function registerRss(app: Express) {
  app.get('/api/rss_get', async function (req, res) {
    if(req.isAuthenticated()) {
      const user = await User.findByPk(req.user ? (req.user as LoginUser).id : undefined);
      if(user === null) {
        res.json({ 'status': 'not_logged_in', articles: [] });
        return;
      }
      
      console.log(user);
      
      const rsses = await (user as any).getRsses() as Rss[];
      
      console.log(rsses);
      
      //console.log(rsses);
      res.json({
        status: 'ok',
        rsses: rsses.map(rss => { return { url: rss.url }; })
      });
    } else {
      res.json({
        status: 'not_logged_in',
        rsses: []
      });
    }
  });

  app.post('/api/rss_update', async function (req, res) {
    if(req.isAuthenticated()) {
      {
        const user = await User.findByPk(req.user ? (req.user as LoginUser).id : undefined,
          {
            include: [ Rss ]
          });
          
        if(user === null) {
          res.json({ 'status': 'not_logged_in', articles: [] });
          return;
        }
        
        const reqRsses = (req.body.rsses as {url: string}[]);
        const dbRsses = (user as any).Rsses as Rss[];
        console.log({
          reqRsses: reqRsses,
          dbRsses: dbRsses
        });
        const dbRssUrls = new Set(dbRsses.map(rss => rss.url));
        const reqRssUrls = new Set(reqRsses.map(rss => rss.url));
        
        //これをもうちょっとどうにかしたいところ
        //DBから毎回全権取得はまあしかたない。
        //bulk insertなどするか
        //新しいものを追加する
        const newRsses = await Promise.all(reqRsses.filter(rss => !dbRssUrls.has(rss.url)).map((rss) => (
          Rss.create({
            userId: user.userId,
            url: rss.url,
          })
        )));
        
        await (user as any).addRsses(newRsses.map(r => r));
        
        const toDelete = dbRsses.filter(rss => !reqRssUrls.has(rss.url));
        console.log({toDelete: toDelete});
        
        //古いものを削除する
        await Promise.all(toDelete.map((rss) => (
          Rss.destroy({
            where: {
              'url': rss.url
            }
          })
        )));
      }
      
      {
        const user = await User.findByPk(req.user ? (req.user as LoginUser).id : undefined);
        const rsses = await (user as any).getRsses() as Rss[];
        
        res.json({
          status: 'ok', rsses: rsses.map((rss) => ({url: rss.url}))
        });
      }
    } else {
      res.json({
        status: 'not_logged_in',
        rsses: []
      });
    }
  });
}

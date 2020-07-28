import express from 'express';
import path from 'path';
import session from 'express-session';
import passport from 'passport';
import passportTwitter from 'passport-twitter';
import helmet from 'helmet';
import logger from 'morgan';
import bodyParser from 'body-parser';
import cookiePaeser from 'cookie-parser';
import { Sequelize } from 'sequelize';

import { database } from './models/sequelize-loader';
import { User } from './models/user';
import { Rss } from './models/rss';
import { Article } from './models/article';
import { Tweet } from './models/tweet';
import { consumerKey, consumerSecret } from './secure_token';
import { UserToken, updateAll } from './fetch_rss';

User.sync().then(() => {
  User.belongsToMany(Rss, { through: 'User_Rsses' });
  Rss.belongsToMany(User, { through: 'User_Rsses' });
  Rss.sync().then(() => {
    Article.belongsTo(Rss, { foreignKey: 'rssId', onDelete: "CASCADE" });
    Rss.hasMany(Article, { foreignKey: 'rssId' });
    Article.sync().then(() => {
      Tweet.belongsTo(Article, { foreignKey: 'articleId', onDelete: "CASCADE" });
      Article.hasMany(Tweet, { foreignKey: 'articleId' });
      Tweet.sync();
    });
  });
});

const siteUrl = 'http://127.0.0.1:8080/';

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new passportTwitter.Strategy({
  consumerKey: consumerKey,
  consumerSecret: consumerSecret,
  callbackURL: siteUrl + 'auth/twitter/callback',
  passReqToCallback: true,
},
  function (req, token, tokenSecret, profile, done) {
    if(req.session !== undefined) {
      req.session.loginInfo = {
        token: token,
        tokenSecret: tokenSecret
      };
    }
    
    process.nextTick(function () {
      return done(null, profile);
    });
}));

export const app = express();

app.use(helmet());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());

app.use(express.static(path.join('./', 'dist', 'client')));

app.use(session({ secret: '417cce55dcfcfaeb', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
});

app.get('/auth/twitter',
  passport.authenticate('twitter', { scope: ['user:email'] }),
  function (req, res) {});

app.get('/api/update/e85aa25b799538a7a07c0475e3f6f6fa5898cdf6',
  async (req, res) => {
    //DB内の任意のユーザのデータを用いる必要がある？
    //まずは、ログイン後に手動で更新で、
    if(req.session !== undefined && req.session.loginInfo !== undefined) {
      await updateAll({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
        access_token_key: req.session.loginInfo.token,
        access_token_secret: req.session.loginInfo.tokenSecret,
      });
      
      res.json({ status: "ok" });
    } else {
      res.json(req.session);
    }
  }
);

app.get('/api/get_list',
  async (req, res) => {
    const TOP_COUNT = req.query.count ? parseInt(req.query.count as string) : 100;
    
    //理想は、ユーザに紐づくものを出したい
    //日次の引き算はinterval型、それを整数に変換するにはextractを使う。
    const articles = await Article.findAll({
      limit: TOP_COUNT,
      order: [[Sequelize.literal("(point - extract(epoch from NOW() - \"pubDate\") / 60 / 20)"), 'DESC']],
    });
    
    res.json({
      articles: articles.map((article: any) => ({
        point: article.point,
        link: article.link,
        title: article.title,
        articleId: article.articleId
      }))
    });
  }
);

app.get('/api/comment_list',
  async (req, res) => {
    try {
      //console.log({articleId: req.query.articleId});
      const article = (await Article.findByPk(req.query.articleId as string, { include: Tweet })) as any;
      //console.dir({article: article }, {depth: 10});
      
      res.json({
        comments: article.Tweets.map((tweet: any) => ({
          commentId: 'tw_' + tweet.tweetOriginalId,
          articleId: tweet.articleId,
          date: tweet.twDate,
          name: tweet.twScreenName,
          text: tweet.twText,
          twUrl: tweet.twUrl,
        })),
        article: {
          title: article.title,
          link: article.link,
          point: article.point,
          articleId: article.articleId,
        }
      });
    } catch (e) {
      console.log(e);
      throw new Error("Illegal article number");
    }
  }
);

app.get('/api/login_user', (req, res) => {
  res.send({userInfo: req.user});
});

app.get('/api/logout', function (req, res) {
  req.logout();
  res.send({status: 'ok'});
});

app.get('/api/rss_get', function (req, res) {
  Rss.findAll()
  .then((rsses) => {
    //console.log(rsses);
    res.json({
      rsses: rsses.map(rss => { return { url: (rss as any).url }; })
    });
  })
});

app.post('/api/rss_update', function (req, res) {
  const reqRsses = (req.body.rsses as {url: string}[]);
  
  Rss.findAll()
  .then((rsses_) => {
    const dbRsses = (rsses_ as any as {url: string}[]);
    const dbRssUrls = new Set(dbRsses.map(rss => rss.url));
    const reqRssUrls = new Set(reqRsses.map(rss => rss.url));
    
    //これをもうちょっとどうにかしたいところ
    //DBから毎回全権取得はまあしかたない。
    //bulk insertなどするか
    //新しいものを追加する
    const insertPromises = reqRsses.filter(rss => !dbRssUrls.has(rss.url)).map((rss) => (
      Rss.upsert({
        url: rss.url
      })
    ));
    
    //古いものを削除する
    const removePromises = dbRsses.filter(rss => !reqRssUrls.has(rss.url)).map((rss) => (
      Rss.destroy({
        where: {
          'url': rss.url
        }
      })
    ));
    
    Promise.all(insertPromises).then(() => {
      Promise.all(removePromises).then(() => {
        Rss.findAll().then((rsses) => {
          res.json({ status: 'OK', rsses: (rsses as any).map((rss: any) => ({url: rss.url})) });
        });
      });
    });
  })
});

app.get('/api', (req, res) => {
  res.send({api: 'test'});
});

// app.get('*main.js', function (req, res) {
//   res.sendFile(path.join('./', 'dist', 'client', 'main.js'))
// });

app.get('*', function (req, res) {
  res.sendFile(path.join('./', 'dist', 'client', 'index.html'))
});

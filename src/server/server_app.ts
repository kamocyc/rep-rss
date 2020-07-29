import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import logger from 'morgan';
import passport from 'passport';
import path from 'path';
import { registerArticle } from './article';
import { registerComment } from './comment';
import { updateAll } from './fetch_rss';
import Article from './models/article';
import Rss from './models/rss';
import { sequelize } from './models/sequelize-loader';
import Tweet from './models/tweet';
import User from './models/user';
import { authMiddleware, registerRememberMe } from './remember_me';
import { registerRss } from './rss';
import { consumerKey, consumerSecret } from './secure_token';


(async () => {
  User.belongsToMany(Rss, { through: 'User_Rsses' });
  
  Rss.belongsToMany(User, { through: 'User_Rsses' });
  Rss.hasMany(Article, { foreignKey: 'rssId' });
  
  Article.belongsTo(Rss, { foreignKey: 'rssId', onDelete: "CASCADE" });
  Article.hasMany(Tweet, { foreignKey: 'articleId' });

  Tweet.belongsTo(Article, { foreignKey: 'articleId', onDelete: "CASCADE" });
  
  await sequelize.sync();
})();

registerRememberMe(passport);

export const app = express();

app.use(helmet());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join('./', 'dist', 'client')));

app.use(session({ secret: '417cce55dcfcfaeb', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function (req, res) {
    console.log("this is /auth/twitter/callbac");
    
    //save remember me
    if(req.session !== undefined && req.session.remember_me) {
      res.cookie('remember_me', req.session.remember_me, {
        path: '/',
        maxAge: 5 * 365 * 24 * 60 * 60 * 1000   // 5年
      });
      
      req.session.remember_me = undefined;
    }
    
    console.dir(req.session, {depth: 10});
    
    res.redirect('/');
});

app.get('/auth/twitter',
  passport.authenticate('twitter', { scope: ['user:email'] }),
  function (/*_req, _res*/) {});

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

registerArticle(app);

registerComment(app);

registerRss(app);

app.get('/api/login_user', authMiddleware, (req, res) => {
  res.send({userInfo: req.user});
});

app.get('/api/logout', function (req, res) {
  console.log("LOGOUT!");
  
  req.logout();
  if(req.session !== undefined) {
    res.clearCookie('remember-me');
    
    req.session.destroy((err) => {
      if(err) {
        console.log({err: err});
      }
      return res.send({status: 'ok'});
    });
  }
  
  return res.send({status: 'ok'});
});

app.get('/api', (req, res) => {
  res.send({api: 'test'});
});

app.get('*', function (req, res) {
  res.sendFile(path.join('./', 'dist', 'client', 'index.html'))
});

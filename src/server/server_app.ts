import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import logger from 'morgan';
import passport from 'passport';
import path from 'path';
import { registerArticle, deleteUnusedArticle } from './article';
import { registerComment } from './comment';
import { updateAll, updateTweetsEntry } from './fetch_rss';
import Article from './models/article';
import Rss from './models/rss';
import { sequelize } from './models/sequelize-loader';
import Tweet from './models/tweet';
import User from './models/user';
import { authMiddleware, registerRememberMe } from './remember_me';
import { registerRss } from './rss';
import { LoginUser }from './common';
import favicon from 'serve-favicon';

(async () => {
  User.belongsToMany(Rss, { through: `${User.tableName}_${Rss.tableName}` });
  
  Rss.belongsToMany(User, { through: `${User.tableName}_${Rss.tableName}` });
  Rss.hasMany(Article, { foreignKey: 'rssId' });
  
  Article.belongsTo(Rss, { foreignKey: 'rssId', onDelete: "CASCADE" });
  Article.hasMany(Tweet, { foreignKey: 'articleId' });

  Tweet.belongsTo(Article, { foreignKey: 'articleId', onDelete: "CASCADE" });
  
  await sequelize.sync();
})();

registerRememberMe(passport);

export const app = express();

app.use(helmet());
app.use(favicon(path.join('./', 'public', 'favicon.ico')))
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

app.post('/api/update/e85aa25b799538a7a07c0475e3f6f6fa5898cdf6',
  async (req, res) => {
    //DB内の任意のユーザのデータを用いる必要がある？
    //まずは、ログイン後に手動で更新で、
    if(req.user !== undefined) {
      const { status, count } = await updateAll((req.user as LoginUser).id);
      
      res.json({ status: "ok", apiStatus: status, count: count });
    } else {
      res.json(req.session);
    }
  }
);

app.post('/api/update_tweet/',
  async (req, res) => {
    if(req.user !== undefined) {
      const pointLowerBound = req.query.point_lower_bound ? parseInt(req.query.point_lower_bound as string) : 3;
      const sinceDayMinus = req.query.since_day_minus ? parseInt(req.query.since_day_minus as string) : 1;
      const lastElapsed = req.query.last_elapsed ? parseInt(req.query.last_elapsed as string) : 15;
      
      const { status, count } = await updateTweetsEntry((req.user as LoginUser).id, pointLowerBound, sinceDayMinus, lastElapsed);
      
      res.json({ status: "ok", apiStatus: status, count: count });
    } else {
      res.json(req.session);
    }
  }
);

deleteUnusedArticle(app);

registerArticle(app);

registerComment(app);

registerRss(app);

app.post('/api/login_user', authMiddleware, (req, res) => {
  // Without req.session.save, we have to login twice!!!
  console.log({"req.session": req.session});
  
  if(req.session !== undefined) {              
    req.session.save(() => {
      res.header('Access-Control-Allow-Credentials','true');
      res.send({userInfo: req.user});
    })
  } else {
    res.header('Access-Control-Allow-Credentials','true');
    res.send({userInfo: req.user});
  }
});

app.post('/api/logout', function (req, res) {
  console.log("LOGOUT!");
  
  res.clearCookie('remember_me');
  
  req.logout();
  if(req.session !== undefined) {
    console.log("session exists!");
    req.session.destroy((err) => {
      if(err) {
        console.log({err: err});
      }
      //これが必要って書いてあったが、要らない？
      //res.header('Access-Control-Allow-Credentials','true');
      return res.send({status:  'ok'});
    });
  } else {
    console.log("session not exists!");
    return res.send({status: 'ok'});
  }
});

app.get('*', function (req, res) {
  console.log({send_file: "send file"});
  console.log({isAuthenticated: req.isAuthenticated()});
  console.log({session: req.session});

  res.sendFile('./index.html', { root: path.join('./', 'dist', 'client') });
});

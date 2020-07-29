import { Strategy as TwitterStrategy } from 'passport-twitter';
import { consumerKey, consumerSecret } from './secure_token';
import User from './models/user';
import { PassportStatic } from 'passport';
import crypto from 'crypto';

interface UserType {
  userId: string;
  username: string;
  oauthToken: string;
  oauthTokenSecret: string;
}

// function consumeRememberMeToken(token: string, fn: (err: any, userId?: string) => void) {
//   User.destroy({ where: { rememberToken: token }}).then((users) => {
//     if(users.length === 0) {
//       return fn("no_token", undefined);
//     } else if(users.length >= 2) {
//       throw new Error("Illegal users.length");
//     }
    
//     const user = users[0];
//     const userId = user.userId;
    
//     // invalidate the single-use token
//     user.userId = null;
//     user.save().then(() => {
//       return fn(undefined, userId);
//     });
//   });
// }

function saveRememberMeToken(token: string, userId: string, username: string, oauthToken: string, oauthTokenSecret: string, fn: (err?: any) => void) {
  User.findOne({ where: { userId: userId }}).then((user) => {
    if(user === null) {
      console.log("create");
      User.create({ 
        userId: userId,
        oauthToken: oauthToken,
        oauthTokenSecret: oauthTokenSecret,
        username: username,
        rememberToken: token,
      }).then(() => {
        return fn();
      });
    } else {
      console.log("update");
      user.rememberToken = token;
      user.oauthToken = oauthToken;
      user.oauthTokenSecret = oauthTokenSecret;
      user.save().then(() => {
        return fn();
      });
    }
  });
}

const siteUrl = 'http://127.0.0.1:8080/';

const APP_HASH_KEY = 'MY APP';

export const authMiddleware = (req: any, res: any, next: () => void) => {
  if(req.isAuthenticated()) {
    next();
  } else if(req.cookies.remember_me) {
    const [rememberToken, hash] = (req.cookies.remember_me as string).split('|');
    
    console.log({hah: [rememberToken, hash]});
    
    User.findAll({
      where: {
        rememberToken: rememberToken
      }
    }).then(users => {
      for(const i in users) {
        console.log("user found!");
        
        const user = users[i];
        
        const verifyingHash = crypto.createHmac('sha256', APP_HASH_KEY)
          .update(user.userId + '-' + rememberToken)
          .digest('hex');
        
        if(hash === verifyingHash) {
          console.log("auth done!");
          // process.nextTick(() => {
            //TODO: 認証
            // return processTwitterLogin(req, user.oauthToken, user.oauthTokenSecret, user.userId, user.username, undefined, (e, u) => {
              return req.login({
                id: user.userId,
                username: user.username
              }, (err: any) => {
                console.log("logged in!");
                console.log({err: err});
                
                // セキュリティ的はここで remember_me を再度更新すべき
                req.session.loginInfo = {
                  token: user.oauthToken,
                  tokenSecret: user.oauthTokenSecret
                };
                
                console.log(req.session.loginInfo);
                
                next();
              });
            // });
          // });
        }
        
        console.log({hash, verifyingHash});
      }
      
      //res.redirect(302, '/login');
    });
  } else {
    //res.redirect(302, '/login');
  }
};

/////
export function registerRememberMe(passport: PassportStatic) {
  passport.serializeUser(function (user, done) {
    console.log({ser_user: user});
    done(null, user);
  });

  passport.deserializeUser(function (obj, done) {
    console.log({des_user: obj});
    done(null, obj);
  });

  //TODO: 暗号化してTOKENを保存
  passport.use(new TwitterStrategy({
    consumerKey: consumerKey,
    consumerSecret: consumerSecret,
    callbackURL: siteUrl + 'auth/twitter/callback',
    passReqToCallback: true,
  },
    function (req, token, tokenSecret, profile, done) {      
      process.nextTick(function () {
        console.log({profile: profile});
        
        return processTwitterLogin(req, token, tokenSecret, profile.id, profile.displayName, profile, done);
      });
  }));
}

function processTwitterLogin(req: any, token: string, tokenSecret: string, userId: string, username: string, fullprofile: any, done: (error: any, user?: any) => void) {
  console.log("processTwitterLogin");
  console.log(req.session);
  
  const rememberToken = crypto.randomBytes(20).toString('hex');
  const hash = crypto.createHmac('sha256', APP_HASH_KEY)
    .update(userId + '-' + rememberToken)
    .digest('hex');
  
  if(req.session !== undefined) {
    req.session.loginInfo = {
      token: token,
      tokenSecret: tokenSecret
    };
    
    req.session.remember_me = rememberToken + '|' + hash;
  }
  
  return saveRememberMeToken(rememberToken, userId, username, token, tokenSecret, () => {
    return done(null, fullprofile);
  });
}
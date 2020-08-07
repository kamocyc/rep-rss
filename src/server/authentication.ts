import crypto from 'crypto';
import { PassportStatic } from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { encryptToken } from './common';
import User from './models/user';
import { APP_HASH_KEY, consumerKey, consumerSecret, siteUrl } from './secure_token';

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
        oauthToken: encryptToken(oauthToken),
        oauthTokenSecret: encryptToken(oauthTokenSecret),
        username: username,
        rememberToken: token,
      }).then(() => {
        return fn();
      });
    } else {
      console.log("update");
      user.rememberToken = token;
      user.oauthToken = encryptToken(oauthToken);
      user.oauthTokenSecret = encryptToken(oauthTokenSecret);
      user.save().then(() => {
        return fn();
      });
    }
  });
}

export const authMiddleware = (req: any, res: any, next: () => void) => {
  console.log({isAuthenticated: "DO"});
  if(req.isAuthenticated()) {
    console.log({isAuthenticated: "isAuthenticated!"});
    next();
  } else if(req.cookies.remember_me) {
    const [rememberToken, hash] = (req.cookies.remember_me as string).split('|');
    
    // console.log({hah: [rememberToken, hash]});
    
    User.findAll({
      where: {
        rememberToken: rememberToken
      }
    }).then(users => {
      console.log("users: " + users.length);
      
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
                
                // TODO: セキュリティ的はここで remember_me を再度更新すべき
                next();
              });
            // });
          // });
        }
        
        //console.log({hash, verifyingHash});
      }
      
      console.log("user not found");
      next();
      //res.redirect(302, '/login');
    });
  } else {
    console.log("no token");
    next();
    //res.redirect(302, '/login');
  }
};

/////
export function registerAuthentication(passport: PassportStatic) {
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (obj, done) {
    done(null, obj);
  });

  passport.use(new TwitterStrategy({
    consumerKey: consumerKey,
    consumerSecret: consumerSecret,
    callbackURL: siteUrl + 'auth/twitter/callback',
    passReqToCallback: true,
  },
    function (req, token, tokenSecret, profile, done) {      
      process.nextTick(function () {
        // console.log({profile: profile});
        
        return processTwitterLogin(req, token, tokenSecret, profile.id, profile.displayName, profile, done);
      });
  }));
}

function processTwitterLogin(req: any, token: string, tokenSecret: string, userId: string, username: string, fullprofile: any, done: (error: any, user?: any) => void) {
  console.log("processTwitterLogin");
  
  const rememberToken = crypto.randomBytes(20).toString('hex');
  const hash = crypto.createHmac('sha256', APP_HASH_KEY)
    .update(userId + '-' + rememberToken)
    .digest('hex');
  
  if(req.session !== undefined) {
    req.session.remember_me = rememberToken + '|' + hash;
  }
  
  return saveRememberMeToken(rememberToken, userId, username, token, tokenSecret, () => {
    return done(null, fullprofile);
  });
}
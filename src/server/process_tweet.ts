import { Status as TweetStatus, FullUser } from 'twitter-d';

export function ProcessTweetsMain(tweets: TweetStatus[], articleTitle: string): {tweets: TweetType[], tweetCount: number} {
  try {
    const allTweets = tweets.map(status => convertTweet(articleTitle, status));
    // remove RTs
    const {commentTweets} = filterComments(allTweets, articleTitle);
    
    const tweetCount = allTweets.length;
  
    return {
      tweets: commentTweets,
      tweetCount: tweetCount
    };
  } catch(e) {
    console.log({"ERROR": e});
    return {
      tweets: [],
      tweetCount: 0
    }
  }
}

export function convertTweet(title: string, status: TweetStatus): TweetType {
  return {
    tweetOriginalId: status.id_str,
    twProfileImage: (status.user as FullUser).profile_image_url_https,
    twScreenName: (status.user as FullUser).screen_name,
    twName: (status.user as FullUser).name,
    twDate: new Date(status.created_at),
    twText: status.full_text,
    twOriginalText: status.full_text,
    twUrl: getTweetUrl(status),
    isRt: isRt(status),
    isComment: false,
  } as TweetType;  
}

export interface TweetType {
  tweetOriginalId: string,
  twScreenName: string,
  twProfileImage?: string,
  twName: string,
  twDate: Date,
  twText: string,
  twOriginalText: string,
  twUrl: string,
  isRt?: boolean,
  isComment: boolean,
}


function trim2(text: string): string {
  // eslint-disable-next-line no-irregular-whitespace
  text = text.replace(/^[\s'`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/◯　、。，．・：；？！゛゜´｀¨＾￣＿ヽヾゝゞ〃〆〇ー―‐／＼～∥｜…‥‘’“”（）〔〕［］｛｝〈〉《》「」『』【】＋－±×÷＝≠＜＞≦≧∞∴♂♀°′″℃￥＄￠￡％＃＆＊＠§☆★○●◎◇◆□■△▲▽▼※〒→←↑↓〓─│┌┐┘└├┬┤┴┼━┃┏┓┛┗┣┳┫┻╋┠┯┨┷┿┝┰┥┸╂￢￤＇＂]+/gi, '')
    // eslint-disable-next-line no-irregular-whitespace
    .replace(/[\s'`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/◯　、。，．・：；？！゛゜´｀¨＾￣＿ヽヾゝゞ〃〆〇ー―‐／＼～∥｜…‥‘’“”（）〔〕［］｛｝〈〉《》「」『』【】＋－±×÷＝≠＜＞≦≧∞∴♂♀°′″℃￥＄￠￡％＃＆＊＠§☆★○●◎◇◆□■△▲▽▼※〒→←↑↓〓─│┌┐┘└├┬┤┴┼━┃┏┓┛┗┣┳┫┻╋┠┯┨┷┿┝┰┥┸╂￢￤＇＂]+$/gi, '');
  
  return text;  
}

function getRedunbantTexts(tweets_: TweetType[]): string[] {
  const tweets = tweets_.map(d => trim2(d.twText));
  const successes = new Set<string>();
  
  const thresholds = {
    same_count: 2,
    length_min: 10
  };
  
  for(let i=0; i<tweets.length; i++) {
    if(tweets[i].length >= thresholds.length_min && !successes.has(tweets[i])) {
      let matched = 0;
      for(let j=i+1; j<tweets.length; j++) {
        if(tweets[j].indexOf(tweets[i]) !== -1) {
          matched ++;
          if(matched >= thresholds.same_count) {
            successes.add(tweets[i]);
            break;
          }
        }
      }
    }
  }
  
  return Array.from(successes.values());
}

function removeDuplicates(tweets: TweetType[]): TweetType[] {
  const mp = new Map<string, TweetType>(); 
  
  for(let i=0; i<tweets.length; i++) {
    const k = trim2(tweets[i].twText);
    if(!mp.has(k)) {
      mp.set(k, tweets[i]);
    }
  }
  
  return Array.from(mp.values());
}

function filterComments(tweets_: TweetType[], title: string) {
  const tweets = tweets_.filter(t => !t.isRt).map(t => ({...t, twText: replaceInsensitive(removeUrls(t.twText), title, '').trim()}));
  
  //URLと記号を削除した部分が記事タイトルのように定型のものなら削除するという機能だが、ここはあまり機能していない...
  const reds = getRedunbantTexts(tweets);
  
  let tweets2 = tweets.map(t => ({...t, twText: reds.reduce((p, c) => replaceInsensitive(p, c, ''), t.twText)}));
  tweets2 = tweets2.filter(t => trim2(t.twText).length > 0);
  tweets2 = removeDuplicates(tweets2);
  //IDの降順にソート
  tweets2.sort((a, b) => a.tweetOriginalId < b.tweetOriginalId ? 1 : -1);
  
  const removedTweets = tweets_.filter(t => tweets2.filter(tt => tt.tweetOriginalId === t.tweetOriginalId).length === 0);
  
  return { commentTweets: tweets2, removedTweets: removedTweets };
}

function getTweetUrl(status: TweetStatus): string | undefined {
  return status.entities.urls && status.entities.urls.length > 0 ? status.entities.urls[0].url : undefined;
}

//https://stackoverflow.com/questions/7313395/case-insensitive-replace-all
function replaceInsensitive(target: string, strReplace: string, strWith: string): string {
  // See http://stackoverflow.com/a/3561711/556609
  const esc = strReplace.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const reg = new RegExp(esc, 'ig');
  return target.replace(reg, strWith);
}

//https://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
function removeUrls(inputText: string): string {
  //URLs starting with http://, https://, or ftp://
  const replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gim;
  //const replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');
  let replacedText = inputText.replace(replacePattern1, '');

  //URLs starting with www. (without // before it, or it'd re-link the ones done above)
  const replacePattern2 = /(^|[^/])(www\.[\S]+(\b|$))/gim;
  //const replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');
  replacedText = replacedText.replace(replacePattern2, '');

  //Change email addresses to mailto:: links
  const replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
  //const replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');
  replacedText = replacedText.replace(replacePattern3, '');

  return replacedText
}

//ツイートのRTやlike数も考慮する者ありだが、まあいい

function isRt(status: TweetStatus): boolean {
  if(status.retweeted_status !== undefined && status.is_quote_status === false) {
    return true;
  }
  
  return false;
}

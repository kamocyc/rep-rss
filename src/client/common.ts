
export type CommentType = {
  text: string,
  articleId: number,
  date: string,
  name: string,
  commentId: number,
  twUrl: string,
  twProfileImage: string,
  twScreenName: string,
  tweetOriginalId: string,
};

export type ArticleType = {
  title: string,
  link: string,
  point: number,
  articleId: number,
  commentCount: number,
  calculatedPoint: number,
  count_twitter_updated: number,
  description: string,
  pubDate: string,
  rssId: number,
};

export function getReadableInterval(date1: Date, date2: Date): string {
  const suffices = {
    second: "second",
    minute: "minute",
    hour: "hour",
    day: "day"
  };
  
  const toPlural = (num: number, text: string) => {
    if(num >= 2) {
      return text + "s";
    }
    return text;
  };
  
  const intervalSec = (date1.getTime() - date2.getTime()) / 1000;
  if(intervalSec < 60) {
    return Math.round(intervalSec) + " " + toPlural(intervalSec, suffices.second);
  }
  
  if(intervalSec / 60 < 60) {
    return Math.round(intervalSec / 60) + " " + toPlural(intervalSec, suffices.minute);
  }
  
  if(intervalSec / 60 / 60 < 24) {
    return Math.round(intervalSec / 60 / 60) + " " + toPlural(intervalSec, suffices.hour);
  }
  
  return Math.round(intervalSec / 60 / 60 / 24) + " " + toPlural(intervalSec, suffices.day);
}

export function updateRss(next: ((reason: any) => void)) {
  (async () => {
    const res1 = await fetch('/api/update/e85aa25b799538a7a07c0475e3f6f6fa5898cdf6', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      }
    );
    
    const res2 = await fetch('/api/update_tweet/', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      }
    );
    
    return [res1, res2];
  })().then(next);
}
  
  
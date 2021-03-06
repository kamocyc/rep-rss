import { tr } from './i18n';
import ReactGA from 'react-ga';

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
    second: tr("second"),
    minute: tr("minute"),
    hour: tr("hour"),
    day: tr("day")
  };
  
  const toPlural = (num: number, text: string) => {
    if(num >= 2) {
      return text + tr("plural");
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

export const GApageView = (page: string) => {   
  ReactGA.pageview(page);   
}
import { formatDate, formatTime } from './common';
import { Status as TweetStatus } from 'twitter-d';
import Twitter from 'twitter-lite';

type TweetObject = {
  statuses: TweetStatus[];  
};

export interface QuerySetting {
  queryString: string;
  since: Date | undefined;
  maxApiCount: number | undefined;
}

export type SearchApiStatus = 'ok' | 'error' | 'rate_limit';

export async function searchAllTweets(qSet: QuerySetting, twClient: Twitter): Promise<{ status: SearchApiStatus, tweets: TweetStatus[], data: any }> {
  let allResults: TweetStatus[] = [];
  
  let minId: string | undefined = undefined;
  
  for (let i=0; (qSet.maxApiCount !== undefined ? i < qSet.maxApiCount : true); i++) {
    const params: { [k: string]: string } = {
      q: qSet.queryString,
      // result_type: 'mixed', //
      count: "100",
      tweet_mode: "extended",
    };
    
    if(minId !== undefined) {
      params.max_id = minId;
    }
    
    if(qSet.since !== undefined) {
      params.q = `${params.q} since:${formatDate(qSet.since)}_${formatTime(qSet.since)}_UTC`;
    }
    
    console.log({queryString: params.q});
    
    let results: TweetObject;
    
    try {
      results = (await twClient.get("search/tweets", params)) as TweetObject;
    } catch (e) {
      if ('errors' in e) {
        if(e.errors[0].code == 88) {
          console.log("Rate limit will reset on", new Date(e._headers.get("x-rate-limit-reset") * 1000));
          return {
            status: 'rate_limit',
            data: "Rate limit will reset on" + (new Date(e._headers.get("x-rate-limit-reset") * 1000)),
            tweets: []
          };
        }
      }
      console.error({"error": e});
      
      return {
        status: "error",
        data: e,
        tweets: []
      };
    }
    
    if(minId !== undefined) {
      //2つ取っている分を消す
      allResults = allResults.concat(results.statuses.filter(r => r.id_str !== minId));
    } else {
      allResults = allResults.concat(results.statuses);
    }
    
    if(results.statuses.length < 100) break;
  
    minId = getMin(results.statuses, r => r.id_str).id_str;
  }
  
  return {
    status: "ok",
    data: undefined,
    tweets: allResults
  };
}


function getMin<T, U>(arr: T[], fn: (v: T) => U): T {
  if(arr.length === 0) {
    throw new Error("getMin: should contain more than one element");
  }
  
  let minval = fn(arr[0]);
  let minelm = arr[0]
  for(let i=1; i<arr.length; i++) {
    if(minval > fn(arr[i])) {
      minval = fn(arr[i]);
      minelm = arr[i];
    }
  }
  
  return minelm;
}

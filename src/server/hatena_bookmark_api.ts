import { SearchApiStatus, QuerySetting } from './twitter_api';
import { TweetType } from './process_tweet';
import fetch from 'node-fetch';

const HatebuEndpoint = 'https://b.hatena.ne.jp/entry/jsonlite/';

interface Bookmark {
  user: string;
  timestamp: string;
  tags: string[];
  comment: string;  
}

interface BookmarkList {
  title: string;
  eid: string;
  bookmarks: Bookmark[];
  count: number;
  url: string;
  entry_url: string;
  screenshot: string;
}

export async function getHatenaBookmark(qSet: QuerySetting): Promise<{ status: SearchApiStatus, tweets: TweetType[], data: any, count: number }> {
  
  const url = qSet.queryString;
  const res = await fetch(HatebuEndpoint + '?url=' + encodeURI(url), {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
    }
  });
  
  const data = (await res.json()) as BookmarkList;
  
  if(data === null) {
    //no bookmarks
    return  {
      status: 'ok',
      tweets: [],
      data: undefined,
      count: 0
    };
  }
  
  if(qSet.since !== undefined) {
    data.bookmarks = data.bookmarks.filter(b => new Date(b.timestamp + ":00+09:00") > (qSet.since as Date));
  }
  
  const allBookmarkCount = data.bookmarks.length;
  
  //console.log({hatebu_data: allBookmarkCount});
  
  const tweets: TweetType[] = 
    data.bookmarks.filter(b => b.comment !== '').map(b => ({
      tweetOriginalId: 'hb_' + data.eid + '_' + b.user,
      twScreenName: b.user,
      twName: b.user,
      twDate: new Date(b.timestamp + ":00+09:00"),
      twText: b.comment,
      twUrl: url,
      isRt: false,
      isComment: true,
      twOriginalText: b.comment
    }));
    
  return {
    status: 'ok',
    tweets: tweets,
    data: undefined,
    count: allBookmarkCount
  };
}


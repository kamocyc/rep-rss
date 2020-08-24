// @ts-ignore
import fetch from 'node-fetch';
import { getHatenaBookmark } from '../../src/server/hatena_bookmark_api';

jest.mock('node-fetch');

beforeEach(async () => {
  (fetch as any).mockClear();
});


describe("getHatenaBookmark", () => {
  test("getHatenaBookmark", async () => {
    const results = await getHatenaBookmark({
      maxApiCount: 0,
      queryString: "a",
      since: undefined,
    });
    
    //変換
    expect(results).toStrictEqual({
      status: 'ok',
      tweets: [{
        tweetOriginalId: "hb_123_user_a",
        twScreenName: "user_a",
        twName: "user_a",
        twDate: new Date("2019/09/21 23:40:00+09:00"),
        twText: "this is comment (1).",
        twUrl: "a",
        isRt: false,
        isComment: true,
        twOriginalText: "this is comment (1)."
      },{
        tweetOriginalId: "hb_123_user_b",
        twScreenName: "user_b",
        twName: "user_b",
        twDate: new Date("2019/09/21 21:00:00+09:00"),
        twText: "this is comment (2).",
        twUrl: "a",
        isRt: false,
        isComment: true,
        twOriginalText: "this is comment (2)."
      }],
      data: undefined,
      //カウントはコメントなしも含む
      count: 3,
    });
  });
  
  test("getHatenaBookmark_empty", async () => {
    const results = await getHatenaBookmark({
      maxApiCount: 0,
      queryString: "empty",
      since: undefined,
    });
    
    expect(results).toStrictEqual({
      status: 'ok',
      tweets: [],
      data: undefined,
      count: 0
    });
  });
  
  test("getHatenaBookmark_since_time", async () => {
    const results = await getHatenaBookmark({
      maxApiCount: 0,
      queryString: "a",
      since: new Date("2019/09/21 21:01:00+09:00"),
    });
    
    expect(results).toStrictEqual({
      status: 'ok',
      tweets: [{
        tweetOriginalId: "hb_123_user_a",
        twScreenName: "user_a",
        twName: "user_a",
        twDate: new Date("2019/09/21 23:40:00+09:00"),
        twText: "this is comment (1).",
        twUrl: "a",
        isRt: false,
        isComment: true,
        twOriginalText: "this is comment (1)."
      }],
      data: undefined,
      count: 1
    });
  });
});


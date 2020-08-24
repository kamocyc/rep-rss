import { processTweetsMain } from '../../src/server/process_tweet';

describe('load_setting', () => {
  test("load_setting", () => {
    const tweets: any[] = 
      [{
        id_str: '1287615283595825152',
        user: {
          profile_image_url_https: "https://abs.twimg.com/images/themes/theme1/bg.png",
          screen_name: "exaday",
          name: "Exaday",
        },
        created_at: 'Mon Jul 27 05:06:21 +0000 2020',
        full_text: "  ~;;It's time to get serious about research fraud https://t.co/sTQh7PoBiW ;; ",
        entities: { urls: [ { url: 'https://t.co/sTQh7PoBiW' } ] },
        retweeted_status: undefined,
        is_quote_status: false,
      }, {
        id_str: '1287615283595825151',
        user: {
          profile_image_url_https: "https://abs.twimg.com/images/themes/theme1/bg.png",
          screen_name: "exaday",
          name: "Exaday",
        },
        created_at: 'Mon Jul 27 05:06:21 +0000 2020',
        full_text: "aaa",
        entities: { urls: [ { url: 'https://t.co/sTQh7PoBiW' } ] },
        retweeted_status: {},
        is_quote_status: false,
      }, {
        id_str: '1287615283595825150',
        user: {
          profile_image_url_https: "https://abs.twimg.com/images/themes/theme1/bg.png",
          screen_name: "exaday",
          name: "Exaday",
        },
        created_at: 'Mon Jul 27 05:06:21 +0000 2020',
        full_text: "bbb \"this is article title\"",
        entities: { urls: [ { url: 'https://t.co/sTQh7PoBiW' } ] },
        retweeted_status: {},
        is_quote_status: true,
      }
      ];
    
    const result = processTweetsMain(tweets, "this is article title");
    
    expect(result).toStrictEqual({
      //countは、RTを含めた数
      tweetCount: 3,
      //IDの降順にソート
      tweets: [
        //convert
        //textからURLは削除
        //前後のスペースは削除
        {
          isComment: false,
          isRt: false,
          twDate: new Date('2020-07-27T05:06:21.000Z'),
          twName: "Exaday",
          twProfileImage: "https://abs.twimg.com/images/themes/theme1/bg.png",
          twOriginalText: "  ~;;It's time to get serious about research fraud https://t.co/sTQh7PoBiW ;; ",
          twScreenName: "exaday",
          twText: "~;;It's time to get serious about research fraud  ;;",
          twUrl: "https://t.co/sTQh7PoBiW",
          tweetOriginalId: "1287615283595825152",
        },
        //RTは削除
        
        //引用RTは残す
        //本文中のタイトルは削除
        { 
          isComment: false,
          isRt: false,
          twDate: new Date('2020-07-27T05:06:21.000Z'),
          twName: "Exaday",
          twProfileImage: "https://abs.twimg.com/images/themes/theme1/bg.png",
          twOriginalText: "bbb \"this is article title\"",
          twScreenName: "exaday",
          twText: "bbb \"\"",
          twUrl: "https://t.co/sTQh7PoBiW",
          tweetOriginalId: "1287615283595825150",
        }
      ]});
  });
});

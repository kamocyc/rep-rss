
export const tr = (key: string): string => {
  const dict: { [key: string]: {en: string, ja: string}} = {
    'please_wait': {en: 'Please wait ...', ja: 'お待ちください ...'},
    'please_login': {en: 'Please login', ja: 'ログインしてください'},
    'app_description':
      {en: 'This App display articles in RSS feeds in order of their number of tweets.',
      ja: 'RSSフィードの記事を、そのツイート数順に表示するアプリです。'},
    'loading': {en: 'Loading ...', ja: '読み込み中 ...'},
    'updating_rss_feeds': {en: 'Updating RSS feeds ...', ja: 'RSSフィードを更新しています ...'},
    'subscribe_rss_feeds':
      {en: `Please subscribe RSS feeds with "Edit RSS" link above`,
       ja: `上の「RSSを編集」リンクからRSSフィードを登録してください`},
    'no_articles': {en: 'No articles', ja: '記事がありません'},
    'login_with_twitter': {en: 'Login with Twitter', ja: 'Twitterでログイン'},
    'back': {en: 'Back', ja: '戻る'},
    'you_are_already_logged_in': {en: 'You are already logged in!', ja: '既にログインしています！'},
    'logout': {en: 'Logout', ja: 'ログアウト'},
    'login': {en: 'Login', ja: 'ログイン'},
    'edit_rss': {en: 'Edit RSS', ja: 'RSSを編集'},
    'add_rss': {en: 'Add RSS', ja: 'RSSを追加'},
    'delete': {en: 'Delete', ja: '削除'},
    'enter_rss_url': {en: 'Enter RSS URL', ja: 'RSSのURLを入力'},
    'illegal_url': {en: 'Illegal URL!!', ja: '不正なURLです'},
    'duplicated': {en: 'Duplicated!!', ja: '重複しています'},
    'plural': {en: 's', ja: ''},
    'second': {en: 'second', ja: '秒'},
    'minute': {en: 'minute', ja: '分'},
    'hour': {en: 'hour', ja: '時間'},
    'day': {en: 'day', ja: '日'},
    'twitter_rate_limit': {en: 'Twitter API rate limit. Please reload page after 15 minutes', ja: 'Twitter APIの制限を超えました。15分以上待ってからページを更新してください。'},
    'ga_agreement': {
      en: 'This website uses Google Analytics to analyze visits of users. We assume that you agree to the use of cookies by using this website.',
      ja: '本サイトではサイトの訪問状況の分析のため、Google Analyticsを利用しておいます。ユーザーは、本サイトを利用することでcookieの使用に許可を与えたものとみなします。'}
  };
  
  if(dict[key] === undefined) {
    throw new Error('Illegal text key');
  }
  
  if(navigator.language !== 'ja' && navigator.language !== 'en') {
    return dict[key].en;
  }
  
  return dict[key][navigator.language];
};


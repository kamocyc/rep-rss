import { rssArticleJsonToBe, rssArticleJson, tweetJson, tweetJsonToBe } from '../data';

export const mockRssParser = jest.fn();

const mock = jest.fn().mockImplementation(() => {
  return {
    parseURL: async (url) => {
      console.log("a");
      return rssArticleJson;
    }
  };
});

export default mock;
import { rssArticleJsonToBe, rssArticleJson, tweetJson, tweetJsonToBe } from '../data';

export const mockRssParser = jest.fn();

const mock = jest.fn().mockImplementation(() => {
  return {
    parseURL: async (url) => {
      return rssArticleJson;
    }
  };
});

export default mock;
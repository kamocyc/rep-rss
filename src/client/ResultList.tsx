import React, { useEffect, useState } from "react";
import { ArticleItem } from './ArticleItem';
import { ArticleType } from './common';

const ResultItem = () => {
  const listApiEndpoint = '/api/article_get';
  const [articles, setArticles] = useState<ArticleType[]>([]);
  
  useEffect(() => {
    fetch(listApiEndpoint)
    .then(res => res.json())
    .then((list: { articles: ArticleType[]}) => {
      list.articles.sort((a, b) => a.calculatedPoint - b.calculatedPoint);
      console.log({"list.articles": list.articles});
      setArticles(list.articles);
    });
  }, []);
  
  return (
    <div>
      {articles.map((article, index) => (
        <ArticleItem index={index} key={index} article={article} />
      ))}
    </div>
  );
};

export const ResultList = () => {
  return (
    <div>
      <ResultItem />
    </div>
    );
};

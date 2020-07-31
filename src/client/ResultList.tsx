import React, { useEffect, useState, useContext } from "react";
import { ArticleItem } from './ArticleItem';
import { ArticleType } from './common';
import { LoginContext } from './login-context';

const ResultItem = () => {
  const listApiEndpoint = '/api/article_get';
  const [articles, setArticles] = useState<ArticleType[]>([]);
  const { state: loginState } = useContext(LoginContext);
  
  useEffect(() => {
    fetch(listApiEndpoint)
    .then(res => res.json())
    .then((list: { articles: ArticleType[]}) => {
      list.articles.sort((a, b) => b.calculatedPoint - a.calculatedPoint);
      console.log({"list.articles": list.articles});
      setArticles(list.articles);
    });
  }, [loginState.userName]);
  
  return (
    <div>
      {articles.map((article, index) => (
        <ArticleItem index={index} key={index} article={article} isList={true} />
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

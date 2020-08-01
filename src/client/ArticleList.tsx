import React from "react";
import { ArticleItem } from './ArticleItem';
import { ArticleType } from './common';

export const ArticleList = ({articles} : {articles:  ArticleType[]}) => {
  return (
    <div>
      {articles.map((article, index) => (
        <ArticleItem index={index} key={index} article={article} isList={true} />
      ))}
    </div>
  );
};

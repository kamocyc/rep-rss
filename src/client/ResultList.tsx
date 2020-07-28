import React, { useState, useEffect } from "react";
import { Row, Col, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import { AppNavBar } from './AppNavBar';
import { ArticleType } from './common';

const Article = ({ index, article } : { index: number, article: ArticleType}) => {
  return (
    <Row>
      <Col xs={1}><p className="h4 article-point">{article.point}</p></Col>
      <Col xs={7}><p className="article-title"><Link to={"/comment/" + article.articleId}>{article.title}</Link></p></Col>
      <Col xs={4}><p className="link-in-list"><a href={article.link}>{article.link}</a></p></Col>
    </Row>
  );
};

const ResultItem = () => {
  const listApiEndpoint = '/api/get_list';
  const [articles, setArticles] = useState<ArticleType[]>([]);
  
  useEffect(() => {
    fetch(listApiEndpoint)
    .then(res => res.json())
    .then(list => {
      console.log({"list.articles": list.articles});
      setArticles(list.articles);
    });
  }, []);
  
  return (
    <div>
      {articles.map((article, index) => (
        <Article index={index} key={index} article={article} />
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

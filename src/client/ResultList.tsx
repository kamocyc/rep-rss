import React, { useState, useEffect } from "react";
import { Row, Col, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import { AppNavBar } from './AppNavBar';

type ArticleType = {
  title: string,
  link: string,
  point: number,
  articleId: number,
};

const Article = ({ index, article } : { index: number, article: ArticleType}) => {
  return (
    <Row>
      <Col sm={1}>{article.point}</Col>
      <Col sm={1}>↑</Col>
      <Col sm={6}><Link to={"/comment/" + article.articleId}>{article.title}</Link></Col>
      <Col sm={4}>{article.link}</Col>
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

import React from "react";
import { Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { ArticleType, getReadableInterval } from './common';

function processArticleLink(link: string): string {
  return link.replace(/(^(https?:\/\/)?([^/]+)\/.*)$/, "$3");
}

export const ArticleItem = ({ article } : { index: number, article: ArticleType}) => {
  return (
    <Row>
      <Col xs={1}>
        <p className="h5 article-point">{article.point}</p>
        <p className="article-point article-comment-count">({article.commentCount})</p>
      </Col>
      <Col xs={1}>
        <p className="article-pub-date">{getReadableInterval(new Date(), new Date(article.pubDate))}</p>
      </Col>
      
      <Col xs={7}><p className="article-title"><Link to={"/comment/" + article.articleId}>{article.title}</Link></p></Col>
      <Col xs={3}><p className="link-in-list"><a href={article.link}>{processArticleLink(article.link)}</a></p></Col>
    </Row>
  );
};

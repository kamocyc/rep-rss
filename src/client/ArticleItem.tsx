import React from "react";
import { Col, Row, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import { ArticleType, getReadableInterval } from './common';

function processArticleLink(link: string): string {
  return link.replace(/(^(https?:\/\/)?([^/]+)\/.*)$/, "$3");
}

export const ArticleItem = ({ article, isList } : { index: number, article: ArticleType, isList: boolean }) => {
  const articleTitle = isList ? (
    <p className="article-title">
      <Link to={"/comment/" + article.articleId}>{article.title}</Link>
    </p>
  ) : (
    <p className="article-title-for-sub">
      <a href={article.link}>{article.title}</a>
    </p>
  );
  
  return (
    <Row>
      <Container>
        <Row>
          <Col xs={2} className="point-col">
            <p className="h5 article-point">{article.point}</p>
            <p className="article-point article-comment-count">({article.commentCount})</p>
          </Col>
          <Col xs={10}>
            {articleTitle}
          </Col>
        </Row>
        <Row>
          <Col xs={2}>
          </Col>
          <Col xs={4}>
            <p className="article-pub-date">{getReadableInterval(new Date(), new Date(article.pubDate))}</p>
          </Col>
          <Col xs={6}><p className="link-in-list"><a href={article.link}>{processArticleLink(article.link)}</a></p></Col>
        </Row>
      </Container>
    </Row>
  );
};

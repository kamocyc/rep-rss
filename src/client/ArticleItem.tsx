import React from "react";
import { Col, Row, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import { ArticleType, getReadableInterval } from './common';
import { tr } from './i18n';

function processArticleLink(link: string): string {
  return link.replace(/(^(https?:\/\/)?([^/]+)\/.*)$/, "$3");
}

export const ArticleItem = ({ index, article, isList } : { index: number, article: ArticleType, isList: boolean }) => {
  // const articleTitle = isList ? (
  //   <p className="article-title">
  //     <Link to={`/comment/${article.articleId}`}>{article.title}</Link>
  //   </p>
  // ) : (
  //   <p className="article-title-for-sub">
  //     <a href={article.link}>{article.title}</a>
  //   </p>
  // );
  
  return (
    <Row>
      <Container className="article-item">
        <Row>
          <Col xs={1} className="point-col">
            <p className="article-rank">{isList ? (index + 1) : ""}</p>
          </Col>
          <Col xs={11}>
            <span className="article-title"><a href={article.link} rel="noopener noreferrer" target="_blank">{article.title}</a></span>
            <span className="link-in-list"><a href={article.link} rel="noopener noreferrer" target="_blank"> &nbsp;({processArticleLink(article.link)})</a></span>
          </Col>
        </Row>
        <Row className="second-article-row">
          <Col xs={1}>
          </Col>
          <Col xs={11}>
            <span className="h5 article-point right-margin">{article.point} {tr("points")}</span>
            <span className="article-pub-date right-margin">{getReadableInterval(new Date(), new Date(article.pubDate))}</span>
            <Link className="article-comment-count" to={`/comment/${article.articleId}`}>{article.commentCount} {tr("comments")}</Link>
          </Col>
        </Row>
      </Container>
    </Row>
  );
};

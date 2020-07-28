import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import { AppNavBar } from './AppNavBar';
import { useParams } from "react-router-dom";
import { CommentType, ArticleType } from './common';

const Comment = ({ index, comment } : { index: number, comment: CommentType }) => {
  return (
    <Row className="comment-row">
      {comment.text}
    </Row>
  );
}

export const CommentList = () => {
  const { articleId } = useParams<{ articleId: string }>();
  
  const commentApiEndpoint = '/api/comment_list';
  const [comments, setComments] = useState<CommentType[]>([]);
  const [article, setArticle] = useState<ArticleType>({
    articleId: 0,
    point: 0,
    title: "",
    link: "#",
  });
  
  useEffect(() => {
    fetch(commentApiEndpoint + '?articleId=' + articleId)
    .then(res => res.json())
    .then(list => {
      console.log(list);
      setComments(list.comments);
      setArticle(list.article);
    });
  }, []);
  
  return (
    <div>
      <AppNavBar />
      <Row>
        <Col xs={1}><p className="h4 article-point">{article.point}</p></Col>
        <Col xs={7}><p className="article-title">{article.title}</p></Col>
        <Col xs={4}><p className="link-in-list"><a href={article.link}>{article.link}</a></p></Col>
      </Row>
      {comments.map((comment, index) => (
        <Comment index={index} key={index} comment={comment} />
      ))}
    </div>
  );
};




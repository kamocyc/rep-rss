import React, { useState, useEffect } from "react";
import { Row, Col, Container } from "react-bootstrap";
import { AppNavBar } from './AppNavBar';
import { useParams } from "react-router-dom";
import { CommentType, ArticleType, getReadableInterval } from './common';
import { ArticleItem } from './ArticleItem';

function getTweetUrl(userScreenName: string, tweetId: string): string {
  return "https://twitter.com/" + userScreenName + "/status/" + tweetId;
}

function getTwitterUserUrl(userScreenName: string): string {
  return "https://twitter.com/" + userScreenName;
}

const Comment = ({ comment } : { index: number, comment: CommentType }) => {
  const elapsed = getReadableInterval(new Date(), new Date(comment.date));
  
  return (
    <Row className="comment-row">
      <Container>
        <Row>
          <span className="tweet-display-name">{comment.name}</span>
          <span className="tweet-id-name"><a href={getTwitterUserUrl(comment.twScreenName)}>{"@" + comment.twScreenName}</a></span>
          <span className="tweet-time"><a href={getTweetUrl(comment.twScreenName, comment.tweetOriginalId)}>{elapsed}</a></span>
        </Row>
        <Row>{comment.text}</Row>
      </Container>
    </Row>
  );
}

export const CommentList = () => {
  const { articleId } = useParams<{ articleId: string }>();
  
  const commentApiEndpoint = '/api/comment_get';
  const [comments, setComments] = useState<CommentType[]>([]);
  const [article, setArticle] = useState<ArticleType>({
    articleId: 0,
    point: 0,
    title: "",
    link: "#",
    commentCount: 0,
    calculatedPoint: 0,
    count_twitter_updated: 0,
    description: "",
    pubDate: new Date(),
    rssId: 1,
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
      <ArticleItem article={article} index={0} />
      {comments.map((comment, index) => (
        <Comment index={index} key={index} comment={comment} />
      ))}
    </div>
  );
};




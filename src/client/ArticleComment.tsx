import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import { AppNavBar } from './AppNavBar';
import { useParams } from "react-router-dom";

type CommentType = {
  text: string
};

const Comment = ({ index, comment } : { index: number, comment: CommentType }) => {
  return (
    <Row>
      {comment.text}
    </Row>
  );
}

export const CommentList = () => {
  const { articleId } = useParams<{ articleId: string }>();
  
  const commentApiEndpoint = '/api/comment_list';
  const [comments, setComments] = useState<CommentType[]>([]);
  
  useEffect(() => {
    fetch(commentApiEndpoint + '?articleId=' + articleId)
    .then(res => res.json())
    .then(list => {
      console.log(list);
      setComments(list.comments);
    });
  });
  
  return (
    <div>
      <AppNavBar />
      {comments.map((comment, index) => (
        <Comment index={index} key={index} comment={comment} />
      ))}
    </div>
  );
};




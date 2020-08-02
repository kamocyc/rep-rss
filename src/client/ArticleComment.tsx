import React, { useEffect, useState } from "react";
import { Container, Row } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { AppNavBar } from './AppNavBar';
import { ArticleItem } from './ArticleItem';
import { ArticleType, CommentType, getReadableInterval } from './common';
import { tr } from './i18n';
import { GApageView } from './common';

function getTweetUrl(userScreenName: string, tweetId: string): string {
  return `https://twitter.com/${userScreenName}/status/${tweetId}`;
}

function getTwitterUserUrl(userScreenName: string): string {
  return `https://twitter.com/${userScreenName}`;
}

function getHatebuUserUrl(userScreenName: string): string {
  return `https://b.hatena.ne.jp/${userScreenName}/`;
}

function isHatebu(comment: CommentType) {
  return comment.tweetOriginalId.substring(0, 3) === 'hb_';
}

const Comment = ({ comment } : { index: number, comment: CommentType }) => {
  const elapsed = getReadableInterval(new Date(), new Date(comment.date));
  
  const commentElm = isHatebu(comment) ?
    (<Row>
      <span className="tweet-display-name"><a href={getHatebuUserUrl(comment.twScreenName)}>{comment.name}</a></span>
      <span className="tweet-id-name"><a href={getHatebuUserUrl(comment.twScreenName)}>{`${comment.twScreenName}`}</a></span>
      <span className="tweet-time"><a href={getHatebuUserUrl(comment.twScreenName)}>{elapsed}</a></span>
    </Row>) :
    (<Row>
      <span className="tweet-display-name"><a href={getTwitterUserUrl(comment.twScreenName)}>{comment.name}</a></span>
      <span className="tweet-id-name"><a href={getTwitterUserUrl(comment.twScreenName)}>{`@${comment.twScreenName}`}</a></span>
      <span className="tweet-time"><a href={getTweetUrl(comment.twScreenName, comment.tweetOriginalId)}>{elapsed}</a></span>
    </Row>);
    
  return (
    <Row className={"comment-row" + (isHatebu(comment) ? '-hatebu' : '')}>
      <Container>
        {commentElm}
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
    articleId: -1,
    point: 0,
    title: "",
    link: "#",
    commentCount: 0,
    calculatedPoint: 0,
    count_twitter_updated: 0,
    description: "",
    pubDate: (new Date()).toString(),
    rssId: 1,
  });
  
  useEffect(() => {
    fetch(commentApiEndpoint + '?articleId=' + articleId)
    .then(res => res.json())
    .then((list : { comments: CommentType[], article: ArticleType }) => {
      console.log(list);
      list.comments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setComments(list.comments);
      setArticle(list.article);
    });
  }, []);
  
  useEffect(() => { GApageView("article_comment"); }, []);
  
  return (
    <div>
      <AppNavBar />
      {article.articleId === -1 ? (<>{tr("loading")}</>) : (<ArticleItem article={article} index={0} isList={false} />)}
      {comments.map((comment, index) => (
        <Comment index={index} key={index} comment={comment} />
      ))}
    </div>
  );
};




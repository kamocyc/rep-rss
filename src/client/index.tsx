import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useContext } from "react";
import { Alert, Button, Col, Container, Row } from 'react-bootstrap';
import ReactDOM from "react-dom";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import { AppNavBar } from './AppNavBar';
import { ArticleUpdateContext, ArticleUpdateContextProvider } from './article-update-context';
import { CommentList } from './ArticleComment';
import { ArticleList } from './ArticleList';
import './css/custom.css';
import { GlobalContext, GlobalContextProvider } from './login-context';
import { RssEditPage } from './RssEdit';

// function SearchPage() {
//   return (
//     <div>
//       <AppNavBar />
//       <SearchArticle />
//       <ArticleList />
//     </div>
//   );
// }

const ProgressBar = ({ articleUpdateState } : { articleUpdateState: boolean }) => {
  switch (articleUpdateState) {
    // case 'wait_update_article':
    // case 'wait_update_tweet':
    case true:
      return (<div className="progress-bar">Updating...</div>);
    default:
      return (<div className="progress-bar done-progress-bar">&nbsp;</div>);
  }
}

export const LoginPage = () => {
  const { state } = useContext(GlobalContext);
  
  const loginButton = state.userName !== undefined ?
    (<Alert variant="warning">You are already logged in!</Alert>) :
    (<Button href="/auth/twitter" className="login-link-button">Login with Twitter</Button>);
    
  return (
    <div>
      <Row className="blank-row"> </Row>
      <Row>
        <Col sm={2}> </Col>
        <Col sm={8}>{loginButton}</Col>
        <Col sm={2}> </Col>
      </Row>
      <Row>
        <Link to="/">Back</Link>
      </Row>
    </div>
  );
};

const TopPage = () => {
  
  const { state: articleState } = useContext(ArticleUpdateContext);
  const { state: loginState } = useContext(GlobalContext);
  
  const articleData = articleState.articleData;
  
  const message = (text: string) => {
    return (<div className="main-message">{text}</div>);
  };
  
  const mainContent =
    !loginState.initialized ? message("Please wait ...") :
    loginState.userName === undefined ? message("Please login") :
    articleData.status === 'not_logged_in' || articleData.status === 'uninitialized' ? message("Loading ...") : 
    articleData.articles.length === 0 && articleState.isUpdating ? message('Updating...') :
    articleData.status === 'no_rss' ? message('Please subscribe RSS feeds with "Edit RSS" link above') :
    articleData.articles.length === 0 ? message('No articles') :
    (<ArticleList articles={articleData.articles} />);
    
  return (
    <div>
      <AppNavBar />
      <ProgressBar articleUpdateState={articleState.isUpdating} />
      {mainContent}
    </div>
  );
}

const Index = () => {
  return (
    <GlobalContextProvider>
    <ArticleUpdateContextProvider>
    <BrowserRouter>
    <div>
    <Container>
      <Switch>  
        <Route exact path="/" render={() => (
          <TopPage />
        )} />
        <Route exact path="/login" component={LoginPage} />
        {/* <Route path="/search" component={SearchPage} /> */}
        <Route path="/edit_rss" component={RssEditPage} />
        <Route path="/comment/:articleId" component={CommentList} />
      </Switch>
    </Container>
    </div>
    </BrowserRouter>
    </ArticleUpdateContextProvider>
    </GlobalContextProvider>
  );
};

ReactDOM.render(<Index />, document.getElementById("index"));
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useContext, useEffect } from "react";
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
import { tr } from './i18n';
import ReactGA from 'react-ga';
import { GApageView } from './common';

ReactGA.initialize("UA-146348131-3");

// function SearchPage() {
//   return (
//     <div>
//       <AppNavBar />
//       <SearchArticle />
//       <ArticleList />
//     </div>
//   );
// }


export const LoginPage = () => {
  const { state } = useContext(GlobalContext);
  useEffect(() => { GApageView("login"); }, []);
  
  const loginButton = state.userName !== undefined ?
    (<Alert variant="warning">{tr("you_are_already_logged_in")}</Alert>) :
    (<Button href="/auth/twitter" className="login-link-button">{tr("login_with_twitter")}</Button>);
    
  return (
    <div>
      <Row className="blank-row"> </Row>
      <Row>
        <Col sm={2}> </Col>
        <Col sm={8}>{loginButton}</Col>
        <Col sm={2}> </Col>
      </Row>
      <Row>
        <Link to="/">{tr("back")}</Link>
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
    !loginState.initialized ? message(tr("please_wait")) :
    loginState.userName === undefined ? (
      <>
        {<p className="app-description">{tr('app_description')}</p>}
        {<Button href="/auth/twitter" className="login-link-button login-link-button-top">{tr("login_with_twitter")}</Button>}
        {<p className="ga-agreement">{tr('ga_agreement')}</p>}
      </>) :
    articleData.status === 'not_logged_in' || articleData.status === 'uninitialized' ? message(tr("loading")) : 
    articleData.articles.length === 0 && articleState.isUpdating ? message(tr('updating_rss_feeds')) :
    articleData.status === 'no_rss' ? (
      <>
        {message(tr('subscribe_rss_feeds'))}
      </> ) :
    articleData.articles.length === 0 ? message(tr('no_articles')) :
    (<ArticleList articles={articleData.articles} />);
    
  return (
    <div>
      <AppNavBar />
      {mainContent}
    </div>
  );
}

const Index = () => {
  useEffect(() => { GApageView("top"); }, []);
  
  return (
    <GlobalContextProvider>
    <ArticleUpdateContextProvider>
    <BrowserRouter>
    <div>
    <Container>
      <Switch>  
        <Route exact path="/" history={history} component={TopPage}/>
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
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useContext } from "react";
import { Alert, Button, Col, Container, Row } from 'react-bootstrap';
import ReactDOM from "react-dom";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import { AppNavBar } from './AppNavBar';
import { CommentList } from './ArticleComment';
import './css/custom.css';
import { LoginContext, LoginContextProvider } from './login-context';
import { ResultList } from './ResultList';
import { RssEditPage } from './RssEdit';
import { SearchArticle } from './SearchArticle';

function SearchPage() {
  return (
    <div>
      <AppNavBar />
      <SearchArticle />
      <ResultList />
    </div>
  );
}

export const LoginPage = () => {
  const { state } = useContext(LoginContext);
  
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

function TopPage() {
  return (
    <div>
      <AppNavBar />
      <ResultList />
    </div>
  );
}

const Index = () => {
  return (
    <LoginContextProvider>
    <BrowserRouter>
    <div>
    <Container>
      <Switch>
        <Route exact path="/" component={TopPage} />
        <Route exact path="/login" component={LoginPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/edit_rss" component={RssEditPage} />
        <Route path="/comment/:articleId" component={CommentList} />
      </Switch>
    </Container>
    </div>
    </BrowserRouter>
    </LoginContextProvider>
  );
};

ReactDOM.render(<Index />, document.getElementById("index"));
import React, { useContext, useState, createContext, useReducer, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Alert, Form, Row, Col, Button, Container, Navbar, Nav, FormControl } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, useHistory, Switch, Route, Link } from "react-router-dom";
import SearchArticle from './SearchArticle';
import { ResultList } from './ResultList';
import { CommentList } from './ArticleComment';
import { RssEditPage } from './RssEdit';
import { AppNavBar } from './AppNavBar';
import { LoginContextProvider, LoginContext } from './login-context';

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
  const {state, dispatch} = useContext(LoginContext);
  
  const loginButton = state.userName !== undefined ?
    (<Alert variant="warning">You are already logged in!</Alert>) :
    (<Button href="/auth/twitter">Login with Twitter</Button>);
    
  return (
    <div>
      {loginButton}
    </div>
  );
};

function TopPage() {
  return (
    <div>
      <AppNavBar />
      <h1>Top</h1>
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
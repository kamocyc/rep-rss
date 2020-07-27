import React, { useContext, useState, createContext, useReducer, useEffect, useRef } from "react";
import { Alert, Form, Row, Col, Button, Container, Navbar, Nav, FormControl } from 'react-bootstrap';
import { BrowserRouter, useHistory, Switch, Route, Link } from "react-router-dom";
import { LoginContextProvider, LoginContext } from './login-context';

export const AppNavBar = () => {
  const {state, dispatch} = useContext(LoginContext);
  const loginStatusEndpoint = '/api/login_user';
  const logoutEndpoint = '/api/logout';
  
  useEffect(() => {
    fetch(loginStatusEndpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then(async response => {
      const data = await response.json();
      if(data.userInfo !== undefined) {
        dispatch({
          type: "SET_LOGIN",
          payload: data.userInfo.username
        });
      } else {
        dispatch({
          type: "SET_LOGOUT",
          payload: undefined
        });
      }
    })
    .catch(error => {
      console.log("ERR");
    });
  }, []);
  
  const handleLogout = () => {
    fetch(logoutEndpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then(async response => {
      const data = await response.json();
      if(data.status === 'ok') {
        dispatch({
          type: "SET_LOGOUT",
          payload: undefined
        });
      }
    })
    .catch(error => {
      console.log("ERR2");
    });
    
  };
  
  const loginOutLink = state.userName !== undefined ?
    (<Nav.Link onClick={() => handleLogout()}>Logout</Nav.Link>) :
    (<Nav.Link as={Link} to="/login">Login</Nav.Link>);  
  
  console.log(state);
  
  return (
    <Navbar>
      <Navbar.Brand as={Link} to='/'>Rep RSS</Navbar.Brand>
      <Nav.Link as={Link} to='/edit_rss'>Edit RSS</Nav.Link>
      <Nav>{state.userName !== undefined ? state.userName : ""}</Nav>
      {loginOutLink}
    </Navbar>);
}

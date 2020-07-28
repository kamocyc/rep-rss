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
    (<Nav.Link onClick={() => handleLogout()} style={{display: "inline"}}>Logout</Nav.Link>) :
    (<Nav.Link as={Link} to="/login" style={{display: "inline"}}>Login</Nav.Link>);  
  
  //console.log(state);
  //Navでカレントがactiveにならないのをどうにかしたい
  return (
    <div>
    <Navbar bg="light" variant="light">
      <Navbar.Brand as={Link} to='/'>Rep RSS</Navbar.Brand>
      <Nav className="mr-auto">
        <Nav.Link as={Link} to='/edit_rss'>Edit RSS</Nav.Link>
        <Nav.Link as={Link} to='/api/update/e85aa25b799538a7a07c0475e3f6f6fa5898cdf6'>(Beta) Update RSS</Nav.Link>
      </Nav>
      <div>
        <Nav style={{display: "inline"}}>{state.userName !== undefined ? state.userName : ""}</Nav>
        {loginOutLink}
      </div>
    </Navbar>
  </div>);
}

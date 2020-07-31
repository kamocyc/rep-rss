import React, { useContext, useEffect, useState } from "react";
import { Nav, Navbar } from 'react-bootstrap';
import { Link } from "react-router-dom";
import { LoginContext } from './login-context';
import { updateRss } from './common';

export const AppNavBar = () => {
  const {state, dispatch} = useContext(LoginContext);
  const [updateButtonState, dispathButtonState] = useState(false);
  const loginStatusEndpoint = '/api/login_user';
  const logoutEndpoint = '/api/logout';
  
  useEffect(() => {
    fetch(loginStatusEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include',
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
      console.log({"ERR": error});
    });
  }, []);
  
  const handleLogout = () => {
    fetch(logoutEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include',
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
      console.log({"ERR2": error});
    });
  };
  
  // const handleUpdateRss = () => {
  //   dispathButtonState(true)
  //   updateRss(() => dispathButtonState(false));
  // };
  
  const loginOutLink = state.userName !== undefined ?
    (<Nav.Link onClick={() => handleLogout()} style={{display: "inline", wordBreak: 'break-all'}}>Logout</Nav.Link>) :
    (<Nav.Link as={Link} to="/login" style={{display: "inline"}}>Login</Nav.Link>);  
  
  //console.log(state);
  //Navでカレントがactiveにならないのをどうにかしたい
  return (
    <div>
    <Navbar bg="light" variant="light">
      <Navbar.Brand as={Link} to='/'>Rep RSS</Navbar.Brand>
      <Nav className="mr-auto">
        <Nav.Link as={Link} to='/edit_rss'>Edit RSS</Nav.Link>
        {/* <Nav.Link onClick={handleUpdateRss} disabled={updateButtonState}>(Beta) Update RSS</Nav.Link> */}
      </Nav>
      <div>
        <Nav style={{display: "inline", wordBreak: 'break-all'}}>{state.userName !== undefined ? state.userName : ""}</Nav>
        {loginOutLink}
      </div>
    </Navbar>
  </div>);
}

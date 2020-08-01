import React, { useContext, useEffect } from "react";
import { Nav, Navbar } from 'react-bootstrap';
import { Link, useLocation } from "react-router-dom";
import { GlobalContext } from './login-context';
import { tr } from './i18n';

export const AppNavBar = () => {
  const {state, dispatch} = useContext(GlobalContext);
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
      dispatch({
        type: "SET_LOGOUT",
        payload: undefined
      });
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
  
  const loginOutLink = state.userName !== undefined ?
    (<Nav.Link onClick={() => handleLogout()} className="logout-link">{tr("logout")}</Nav.Link>) :
    (<Nav.Link as={Link} to="/login" style={{display: "inline"}}>{tr('login')}</Nav.Link>);  
  
  //console.log(state);
  //Navでカレントがactiveにならないのをどうにかしたい
  return (
    <div>
    <Navbar bg="light" variant="light">
      <Navbar.Brand as={Link} to='/'>Rep RSS</Navbar.Brand>
      <Nav className="mr-auto">
        {state.userName === undefined ? (<></>) : (<Nav.Link as={Link} to='/edit_rss'>{tr("edit_rss")}</Nav.Link>)}
      </Nav>
      <div>
        {/* TODO: どのページからもログアウトできるようにする。（その場合ログアウト後に画面を遷移させる必要がある） */}
        {useLocation().pathname === '/' ? (
          <>
            <Nav style={{display: "inline", wordBreak: 'break-all'}}>{state.userName !== undefined ? state.userName : ""}</Nav>
            {loginOutLink}
          </>
        ) : <></>}
      </div>
    </Navbar>
  </div>);
}

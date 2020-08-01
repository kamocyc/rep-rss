import React, { useContext, useEffect } from "react";
import { Nav, Navbar } from 'react-bootstrap';
import { Link } from "react-router-dom";
import { GlobalContext } from './login-context';
import { tr } from './i18n';
// import { updateRss } from './common';

export const AppNavBar = () => {
  const {state, dispatch} = useContext(GlobalContext);
  // const [updateButtonState, dispathButtonState] = useState(false);
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
      console.log(data);
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
  
  // const handleUpdateRss = () => {
  //   dispathButtonState(true)
  //   updateRss(() => dispathButtonState(false));
  // };
  
  const loginOutLink = state.userName !== undefined ?
    (<Nav.Link onClick={() => handleLogout()} style={{display: "inline", wordBreak: 'break-all'}}>{tr("logout")}</Nav.Link>) :
    (<Nav.Link as={Link} to="/login" style={{display: "inline"}}>{tr('login')}</Nav.Link>);  
  
  //console.log(state);
  //Navでカレントがactiveにならないのをどうにかしたい
  return (
    <div>
    <Navbar bg="light" variant="light">
      <Navbar.Brand as={Link} to='/'>Rep RSS</Navbar.Brand>
      <Nav className="mr-auto">
        {state.userName === undefined ? (<></>) : (<Nav.Link as={Link} to='/edit_rss'>{tr("edit_rss")}</Nav.Link>)}
        {/* <Nav.Link onClick={handleUpdateRss} disabled={updateButtonState}>(Beta) Update RSS</Nav.Link> */}
      </Nav>
      <div>
        <Nav style={{display: "inline", wordBreak: 'break-all'}}>{state.userName !== undefined ? state.userName : ""}</Nav>
        {loginOutLink}
      </div>
    </Navbar>
  </div>);
}

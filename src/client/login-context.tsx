import React, { createContext, Dispatch, useReducer } from "react";
import { updateRss } from './common';

interface LoginContextType {
  initialized: boolean;
  userName: string | undefined;
}
interface LoginAction {
  type: string;
  payload: string | undefined;
}

const initState: LoginContextType = {
  initialized: false,
  userName: undefined,
};

export const LoginContext = createContext<{
  state: LoginContextType;
  dispatch: Dispatch<LoginAction>;
}>({
  state: initState,
  dispatch: () => null
});

const reducer = (state: LoginContextType, action: LoginAction): LoginContextType => {
  switch (action.type) {
    case "SET_LOGIN":
      if(state.initialized === false) {
        updateRss(() => {});
      }
      
      return {
        initialized: true,
        userName: action.payload
      };  
    case "SET_LOGOUT":
      return {
        initialized: true,
        userName: undefined
      };
    default:
      throw new Error();
  }
};

export const LoginContextProvider = (props: any) => {
  const [state, dispatch] = useReducer(reducer, initState);
  
  return <LoginContext.Provider value={{state, dispatch}}>{props.children}</LoginContext.Provider>
}

import React, { createContext, useReducer, Dispatch } from "react";

interface LoginContextType {
  userName?: string;
}

const initState: LoginContextType = {
  userName: undefined
};

export const LoginContext = createContext<{
  state: LoginContextType;
  dispatch: Dispatch<any>;
}>({
  state: initState,
  dispatch: () => null
});

const reducer = (state: any, action: any): { userName?: string } => {
  switch (action.type) {
    case "SET_LOGIN":
      return {
        userName: action.payload
      };  
    case "SET_LOGOUT":
      return {
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

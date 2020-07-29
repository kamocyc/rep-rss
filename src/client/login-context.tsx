import React, { createContext, Dispatch, useReducer } from "react";

interface LoginContextType {
  userName?: string;
}
interface LoginAction {
  type: string;
  payload: string | undefined;
}

const initState: LoginContextType = {
  userName: undefined
};

export const LoginContext = createContext<{
  state: LoginContextType;
  dispatch: Dispatch<LoginAction>;
}>({
  state: initState,
  dispatch: () => null
});

const reducer = (state: LoginContextType, action: LoginAction): { userName?: string } => {
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

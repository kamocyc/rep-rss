import React, { createContext, Dispatch, useReducer } from "react";

interface GlobalContextType {
  initialized: boolean;
  userName: string | undefined;
}
interface LoginAction {
  type: 'SET_LOGIN' | 'SET_LOGOUT' | 'INC_RSS_UPDATE';
  payload?: string | undefined;
}

const initState: GlobalContextType = {
  initialized: false,
  userName: undefined,
};

export const GlobalContext = createContext<{
  state: GlobalContextType;
  dispatch: Dispatch<LoginAction>;
}>({
  state: initState,
  dispatch: () => null
});

const reducer = (state: GlobalContextType, action: LoginAction): GlobalContextType => {
  switch (action.type) {
    case "SET_LOGIN":
      return {
        ...state,
        initialized: true,
        userName: action.payload
      };  
    case "SET_LOGOUT":
      return {
        ...state,
        initialized: true,
        userName: undefined
      };
    default:
      throw new Error();
  }
};

export const GlobalContextProvider = (props: any) => {
  const [state, dispatch] = useReducer(reducer, initState);
  
  return <GlobalContext.Provider value={{state, dispatch}}>{props.children}</GlobalContext.Provider>
}

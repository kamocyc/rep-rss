import React, { createContext, Dispatch, useReducer } from "react";


interface GlobalContextType {
  csrfToken: string;
  wasLoginInitialized: boolean;
  userName: string | undefined;
}

type LoginActionType = 'SET_LOGIN' | 'SET_LOGOUT';

interface LoginAction {
  type: LoginActionType;
  payload?: string | undefined;
}

function getCSRFToken(): string {
  return document.cookie.split('; ').find(r => r.startsWith('CSRF-TOKEN'))?.split('=')[1] ?? ""
}

const initState: GlobalContextType = {
  csrfToken: getCSRFToken(),
  wasLoginInitialized: false,
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
        wasLoginInitialized: true,
        userName: action.payload
      };  
    case "SET_LOGOUT":
      return {
        ...state,
        wasLoginInitialized: true,
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

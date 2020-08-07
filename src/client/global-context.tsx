import React, { createContext, Dispatch, useReducer } from "react";

interface GlobalContextType {
  csrfToken: string;
  wasLoginInitialized: boolean;
  userName: string | undefined;
}
interface LoginAction {
  type: 'SET_LOGIN' | 'SET_LOGOUT' | 'INC_RSS_UPDATE';
  payload?: string | undefined;
}

function getCSRFToken(): string {
  const res = document.cookie.split('; ').find(r => r.startsWith('CSRF-TOKEN'))?.split('=')[1];
  console.log(document.cookie);
  return res === undefined ? "" : res;
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

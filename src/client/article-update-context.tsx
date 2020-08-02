import React, { createContext, Dispatch, useContext, useEffect, useReducer } from "react";
import { ArticleType } from './common';
import './css/custom.css';
import { GlobalContext } from './login-context';
import { useDataApi } from './useDataApi';

interface ArticleUpdateContextType {
  isUpdating: boolean;
  isReloading: boolean;
  articleData: { articles: ArticleType[]; status: string };
  updateCount: number;
  reloadCount: number;
}
interface ArticleUpdateAction {
  type: string;
  articleData?: { articles: ArticleType[]; status: string };
}

const initState: ArticleUpdateContextType = {
  isUpdating: false,
  isReloading: false,
  articleData: { articles: [] as ArticleType[], status: 'uninitialized' },
  updateCount: 0,
  reloadCount: 0
};

export const ArticleUpdateContext = createContext<{
  state: ArticleUpdateContextType,
  dispatch: Dispatch<ArticleUpdateAction>
}>({
  state: initState,
  dispatch: () => null
});

const reducer = (state: ArticleUpdateContextType, action: ArticleUpdateAction): ArticleUpdateContextType => {
  console.log({"action.type": action.type, state, action});
  
  switch (action.type) {
    case 'UPDATE':
      return {
        ...state,
        isUpdating: true,
        updateCount: state.updateCount + 1
      };
    case 'RELOAD':
      return {
        ...state,
        isReloading: true,
        reloadCount: state.reloadCount + 1
      };
    case '__SET_ARTICLES':
      if(action.articleData !== undefined) {
        return {
          ...state,
          isReloading: false,
          articleData: action.articleData
        };
      }
      throw new Error('Illegal ation type + articleData');
    case '__FINISH_UPDATING':
      return {
        ...state,
        isUpdating: false
      };
    default:
      throw new Error('Illegal ation type');
  }
}

export const ArticleUpdateContextProvider = (props: any) => {
  const listApiEndpoint = '/api/article_get';
  const [state, dispatch] = useReducer(reducer, initState);
  const { state: loginState } = useContext(GlobalContext);
  const { state: articleDataState, url: currentUrl, checkData, setCheckData, setUrl } =
    useDataApi<{ articles: ArticleType[], status: string }, {count: number}>(
      '',
      { method: 'GET' },
      { count: 0 },
      { articles: [], status: "uninitialized" });
  
  useEffect(() => {
    console.log({articleDataState: articleDataState})
    articleDataState.data.articles.sort((a, b) => b.calculatedPoint - a.calculatedPoint);
    dispatch({type: '__SET_ARTICLES', articleData: articleDataState.data});
  }, [articleDataState]);
  
  useEffect(() => {
    console.log({"loginState.userName": loginState.userName});
    if(articleDataState.isLoading !== true) {
      if(loginState.userName !== undefined) {
        if(currentUrl === '') {
          setUrl(listApiEndpoint); 
        } else {
          console.log({reloadcount: state.reloadCount});
          setCheckData({count: checkData.count + 1});
        }
      }
    } else {
      console.log({reloadcount: state.reloadCount, loading: articleDataState.isLoading});
    }
  }, [loginState.userName, state.reloadCount]);
  
  useEffect(() => {
    if(loginState.userName !== undefined) {
      (async () => {
        // setArticleUpdateState({status: 'wait_update_article'});
        
        const res1 = await fetch('/api/update/e85aa25b799538a7a07c0475e3f6f6fa5898cdf6', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include',
          }
        );
        
        const { /*count: count1,*/ status: status1, apiStatus: apiStatus1 } = await res1.json();
        if(status1 !== 'ok') { console.warn('update 1 error: ' + status1); }
        if(apiStatus1 !== 'ok') { console.warn('update 1 API error: ' + apiStatus1); }
        // setArticleUpdateState({status: 'wait_update_tweet'});
        
        const res2 = await fetch('/api/update_tweet/', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include',
          }
        );
        
        const { /*count: count2, */ status: status2, apiStatus: apiStatus2 } = await res2.json();
        if(status2 !== 'ok') { console.error('update 2 error: ' + status2); }
        if(apiStatus2 !== 'ok') { console.warn('update 2 API error: ' + apiStatus2); }
        // setArticleUpdateState({status: 'wait_article_clean'});
        // if(count1 + count2 > 0) {
        //reloadする
        dispatch({type: 'RELOAD'});
        // }
        
        const res3 = await fetch('/api/article_clean/', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include',
        })
        
        const { /*count: count3, */ status: status3 } = await res3.json();
        if(status3 !== 'ok') { console.warn('update 3 error: ' + status3); }
        
        // // setArticleUpdateState({status: 'done'});
        
        dispatch({type: '__FINISH_UPDATING'});
        
        return;
      })();
    }
  }, [loginState.userName, state.updateCount]);
  
  return <ArticleUpdateContext.Provider value={{state, dispatch}}>{props.children}</ArticleUpdateContext.Provider>;
}

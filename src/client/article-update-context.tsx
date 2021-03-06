import React, { createContext, Dispatch, useContext, useEffect, useReducer } from "react";
import { ArticleType } from './common';
import './css/custom.css';
import { GlobalContext } from './global-context';
import { useDataApi } from './useDataApi';
import { tr } from './i18n';

interface ArticleDataType {
  articles: ArticleType[];
  status: string;
}

interface ArticleUpdateContextType {
  isUpdating: boolean;
  isReloading: boolean;
  articleData: ArticleDataType;
  updateCount: number;
  reloadCount: number;
}
interface ArticleUpdateAction {
  type: string;
  articleData?: { articles: ArticleType[]; status: string };
}

const initState: ArticleUpdateContextType = {
  isUpdating: false,
  isReloading: true,
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
    case 'INIT_UPDATING':
      return {
        ...state,
        isUpdating: true
      };
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
      throw new Error('(__SET_ARTICLES) articleData should not be undefined');
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
  const { state: globalState } = useContext(GlobalContext);
  const { state: articleDataState, url: currentUrl, checkData, setCheckData, setUrl } =
    useDataApi<ArticleDataType, {count: number}>(
      '',
      { method: 'GET' },
      { count: 0 },
      { articles: [], status: "uninitialized" });
  
  //取得したarticleをソート
  useEffect(() => {
    console.log({articleDataState: articleDataState})
    articleDataState.data.articles.sort((a, b) => b.calculatedPoint - a.calculatedPoint);
    dispatch({type: '__SET_ARTICLES', articleData: articleDataState.data});
  }, [articleDataState]);
  
  //articleをreload
  useEffect(() => {
    console.log({"globalState.userName": globalState.userName});
    if(globalState.userName !== undefined && state.reloadCount == 0) {
      dispatch({type: 'INIT_UPDATING'});
    }
    
    if(articleDataState.isLoading !== true) {
      if(globalState.userName !== undefined) {
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
  }, [globalState.userName, state.reloadCount]);
  
  //articleのupdate
  useEffect(() => {
    if(globalState.userName !== undefined) {
      (async () => {        
        const res1 = await fetch('/api/update', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              "CSRF-Token": globalState.csrfToken
            },
            credentials: 'include',
          }
        );
        
        const { /*count: count1,*/ status: status1, apiStatus: apiStatus1 } = await res1.json();
        if(status1 !== 'ok') { console.warn('update 1 error: ' + status1); }
        if(apiStatus1 !== 'ok') {
          console.warn('update 1 API error: ' + apiStatus1);
          if(apiStatus1 === 'rate_limit') {
            alert(tr("twitter_rate_limit"));
            dispatch({type: 'RELOAD'});
            dispatch({type: '__FINISH_UPDATING'});
            return;
          }
        }
        
        const res2 = await fetch('/api/update_tweet', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              "CSRF-Token": globalState.csrfToken
            },
            credentials: 'include',
          }
        );
        
        const { /*count: count2, */ status: status2, apiStatus: apiStatus2 } = await res2.json();
        if(status2 !== 'ok') { console.error('update 2 error: ' + status2); }
        if(apiStatus2 !== 'ok') {
          console.warn('update 2 API error: ' + apiStatus2);
          
          if(apiStatus2 === 'rate_limit') {
            alert(tr("twitter_rate_limit"));
            dispatch({type: 'RELOAD'});
            dispatch({type: '__FINISH_UPDATING'});
            return;
          }
        }
        
        //reloadする
        dispatch({type: 'RELOAD'});
        
        const res3 = await fetch('/api/article_clean/', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              "CSRF-Token": globalState.csrfToken
            },
            credentials: 'include',
        })
        
        const { /*count: count3, */ status: status3 } = await res3.json();
        if(status3 !== 'ok') { console.warn('update 3 error: ' + status3); }
        
        dispatch({type: '__FINISH_UPDATING'});
        
        return;
      })();
    }
  }, [globalState.userName, state.updateCount]);
  
  return <ArticleUpdateContext.Provider value={{state, dispatch}}>{props.children}</ArticleUpdateContext.Provider>;
}

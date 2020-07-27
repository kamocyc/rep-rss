import React, { useContext, useState, createContext, useReducer, useEffect, useRef } from "react";
import { AppNavBar } from './AppNavBar';

type Rss = {
  url: string 
};
type RssActionType = {
  type: string,
  rsses?: Rss[],
  url?: string,
  index?: number
};

//https://www.mitsue.co.jp/knowledge/blog/frontend/201912/24_0000.html
const initRss = (rsses: Rss[]) => { return {type: 'INIT_RSS', rsses: rsses}; };
const addRss = (url: string) => { return {type: 'ADD_RSS', url: url }};
const removeRss = (index: number) => { return {type: 'REMOVE_RSS', index: index }};

type RssResucerType = (rsses: Rss[], action: RssActionType) => Rss[];

const rssReducer: RssResucerType = (rsses, action) => {
  switch (action.type) {
    case 'INIT_RSS':
      return action.rsses as Rss[];
    case 'ADD_RSS':
      return ([...rsses, {
        url: action.url as string,
      }] as Rss[]);
    case 'REMOVE_RSS':
      const newRsses = [];
      for(let i=0; i<rsses.length; i++) {
        if(action.index !== i) {
          newRsses.push(rsses[i]);
        }
      }
      return newRsses;
    default:
      throw Error("illegal action type: " + action.type);
      return [...rsses];
  }
};

const useRender = (getEndpoint: string, updateEndpoint: string) => {
  const [rsses, dispatch] = useReducer(rssReducer, []);
  const isFirstRender = useRef(true);
  const isServerChange = useRef(false);
  
  useEffect(() => {
    if(isServerChange.current) {
      isServerChange.current = false;
      return;
    }
    
    if(isFirstRender.current) {
      fetch(getEndpoint)
      .then(res => res.json())
      .then(init => {
        isServerChange.current = true;
        dispatch(initRss(init.rsses));
        isFirstRender.current = false;
      });
    } else {
      //クライアントの都合で変わったときのみ動くべき。
      fetch(updateEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          rsses: [...rsses]
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(init => {
        isServerChange.current = true;
        dispatch(initRss(init.rsses));
      });
    }
  }, [getEndpoint, updateEndpoint, rsses]);
  
  return {rsses, dispatch};
}

const Rss = ({ rss, index, dispatch }: { rss: Rss, index: number, dispatch: React.Dispatch<RssActionType> }) => {
  return (
    <li>
      <p>{ rss.url }</p>
      <ul className="button-list">
        <li>
          <button type="button" onClick={() => dispatch(removeRss(index))}>削除</button>
        </li>
      </ul>
    </li>
  );
};

const RssList = ({ rsses, dispatch }: { rsses: Rss[], dispatch: React.Dispatch<RssActionType>}) => {
  return (
    <div>
      <ul className="rss-list">
        {rsses.map((rss, index) => (
          <Rss index={index} key={index} rss={rss} dispatch={dispatch} />
        ))}
      </ul>
    </div>
  )
};

const RssForm = ({ dispatch } : { dispatch: React.Dispatch<RssActionType> }) => {
  const [rssUrl, setRssUrl] = useState('');
  
  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!rssUrl) return;
    dispatch(addRss(rssUrl));
    setRssUrl('');
  };
  
  return (
    <form onSubmit={submitHandler}>
      <input 
        type="text"
        placeholder="Enter RSS URL"
        value={rssUrl}
        onChange={e => setRssUrl(e.target.value)}
      />
      <button type="submit">Add RSS</button>
    </form>
  );
};

export const RssEditPage = ()=> {
  const {rsses, dispatch} = useRender('/api/rss_get', '/api/rss_update');
  
  return (
    <div className="rss-wrap">
      <AppNavBar />
      <RssList rsses={rsses} dispatch={dispatch} />
      <RssForm dispatch={dispatch} />
    </div>
  );
};

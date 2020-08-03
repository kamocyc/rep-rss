import React, { useEffect, useReducer, useRef, useState, useContext } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { AppNavBar } from './AppNavBar';
import { ArticleUpdateContext } from './article-update-context';
import { tr, getExampleRss } from './i18n';
import { GApageView } from './common';

type RssState = {
  initialized: boolean,
  rsses: Rss[]
};

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

type RssResucerType = (rssState: RssState, action: RssActionType) => RssState;

const rssReducer: RssResucerType = (rssState, action): RssState => {
  console.log({rssState: rssState, action: action})
  switch (action.type) {
    case 'INIT_RSS':
      return {
        initialized: true,
        rsses: action.rsses as Rss[]
      };
    case 'ADD_RSS':
      return {
        rsses: ([...rssState.rsses, {
          url: action.url as string,
        }] as Rss[]),
        initialized: true,
      };
    case 'REMOVE_RSS':
      {
        const newRsses = [];
        for(let i=0; i<rssState.rsses.length; i++) {
          if(action.index !== i) {
            newRsses.push(rssState.rsses[i]);
          }
        }
        return {
          rsses: newRsses,
          initialized: true
        };
      }
    default:
      throw Error("illegal action type: " + action.type);
      return rssState;
  }
};

const useRender = (getEndpoint: string, updateEndpoint: string) => {
  const [rssState, dispatch] = useReducer(rssReducer, {initialized: false, rsses: []});
  const { dispatch: articleUpdateDispatch } = useContext(ArticleUpdateContext);
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
          rsses: [...rssState.rsses]
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(init => {
        isServerChange.current = true;
        dispatch(initRss(init.rsses));
        articleUpdateDispatch({type: 'UPDATE'});
      });
    }
  }, [getEndpoint, updateEndpoint, rssState.rsses]);
  
  return {rssState, dispatch};
}

const Rss = ({ rss, index, dispatch }: { rss: Rss, index: number, dispatch: React.Dispatch<RssActionType> }) => {
  return (
    <li>
      <Row className="rss-row">
        <Col sm={10} style={{wordBreak: "break-all"}}>{ rss.url }</Col>
        <Col sm={2}><Button type="button" variant="danger" onClick={() => dispatch(removeRss(index))}>{tr('delete')}</Button></Col>
      </Row>
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

//TODO: サーバサイドでちゃんとした検査を実装
//URLの簡易検査
function isUrlLike(text: string) {
  const replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/im;
  
  return text.match(replacePattern1) !== null;
}

const RssForm = ({ dispatch ,rssState } : { dispatch: React.Dispatch<RssActionType>, rssState: RssState }) => {
  const [rssUrl, setRssUrl] = useState('');
  
  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!rssUrl) return;
    if(!isUrlLike(rssUrl)) {
      alert(tr("illegal_url"));
      return;
    }
    
    //重複の簡易検査
    if(rssState.rsses.find(rss => rss.url.toLowerCase() === rssUrl.toLowerCase()) !== undefined) {
      alert(tr("duplicated"));
      return;
    }

    dispatch(addRss(rssUrl));
    setRssUrl('');
  };
  
  const handleSampleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    console.log((e.target as HTMLButtonElement).getAttribute('data-key'));
    dispatch(addRss(getExampleRss()[parseInt((e.target as HTMLButtonElement).getAttribute('data-key') as string)]));
  };
  
  const hintButton = rssState.rsses.length === 0 && rssState.initialized === true ?
    (<>
      {getExampleRss().map((url, i) => (<Button variant="info" key={i} data-key={i} onClick={handleSampleClick}>{tr('register_with', url)}</Button>))}
    </>) :
    (<></>);
    
  return (
    <>
      <Form onSubmit={submitHandler}>
        <Form.Row className="align-items-center">
          <Col sm={10}>
            <Form.Control 
              type="text"
              placeholder={tr('enter_rss_url')}
              value={rssUrl}
              onChange={e => setRssUrl(e.target.value)}
            />
          </Col>
          <Col sm={2}>
            <Button type="submit">{tr("add_rss")}</Button>
          </Col>
        </Form.Row>
      </Form>
      {hintButton}
    </>
  );
};

export const RssEditPage = () => {
  const {rssState, dispatch} = useRender('/api/rss_get', '/api/rss_update');
  useEffect(() => { GApageView("rss_edit"); }, []);
  
  console.log({rssState: rssState});
  
  return (
    <div className="rss-wrap">
      <AppNavBar />
      <RssList rsses={rssState.rsses} dispatch={dispatch} />
      <RssForm dispatch={dispatch} rssState={rssState} />
    </div>
  );
};

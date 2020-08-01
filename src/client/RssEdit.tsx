import React, { useEffect, useReducer, useRef, useState, useContext } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { AppNavBar } from './AppNavBar';
import { ArticleUpdateContext } from './article-update-context';
import { tr } from './i18n';

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
      {
        const newRsses = [];
        for(let i=0; i<rsses.length; i++) {
          if(action.index !== i) {
            newRsses.push(rsses[i]);
          }
        }
        return newRsses;
      }
    default:
      throw Error("illegal action type: " + action.type);
      return [...rsses];
  }
};

const useRender = (getEndpoint: string, updateEndpoint: string) => {
  const [rsses, dispatch] = useReducer(rssReducer, []);
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
        articleUpdateDispatch({type: 'UPDATE'});
      });
    }
  }, [getEndpoint, updateEndpoint, rsses]);
  
  return {rsses, dispatch};
}

const Rss = ({ rss, index, dispatch }: { rss: Rss, index: number, dispatch: React.Dispatch<RssActionType> }) => {
  return (
    <li>
      <Row className="rss-row">
        <Col sm={11}>{ rss.url }</Col>
        <Col sm={1}><Button type="button" variant="danger" onClick={() => dispatch(removeRss(index))}>{tr('delete')}</Button></Col>
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

const RssForm = ({ dispatch ,rsses } : { dispatch: React.Dispatch<RssActionType>, rsses: Rss[] }) => {
  const [rssUrl, setRssUrl] = useState('');
  
  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!rssUrl) return;
    if(!isUrlLike(rssUrl)) {
      alert(tr("illegal_url"));
      return;
    }
    
    //重複の簡易検査
    if(rsses.find(rss => rss.url.toLowerCase() === rssUrl.toLowerCase()) !== undefined) {
      alert(tr("duplicated"));
      return;
    }

    dispatch(addRss(rssUrl));
    setRssUrl('');
  };
  
  return (
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
  );
};

export const RssEditPage = () => {
  const {rsses, dispatch} = useRender('/api/rss_get', '/api/rss_update');
  
  return (
    <div className="rss-wrap">
      <AppNavBar />
      <RssList rsses={rsses} dispatch={dispatch} />
      <RssForm dispatch={dispatch} rsses={rsses} />
    </div>
  );
};

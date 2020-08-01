import { useEffect, useState, useReducer } from "react";

export interface DataFetchReducerState<T> {
  isLoading: boolean | undefined;
  isError: boolean;
  data: T,
}
interface DataFetchReducerAction<T> {
  type: 'FETCH_INIT' | 'FETCH_SUCCESS' | 'FETCH_FAILURE';
  payload?: T
}

const dataFetchReducer = < T extends {} >(state: DataFetchReducerState<T>, action: DataFetchReducerAction<T>) => {
  switch (action.type) {
    case 'FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false
      };
    case 'FETCH_SUCCESS':
      if(action.payload !== undefined) {
        return {
          ...state,
          isLoading: false,
          isError: false,
          data: action.payload,
        };
      } else {
        throw new Error("[FETCH_SUCCESS] payload should not be undefined");
      }
    case 'FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

export const useDataApi = < T, S >(initialUrl: string, fetchOptions: RequestInit, initCheckData: S, initialData: T) => {
  const [url, setUrl] = useState(initialUrl);
  const [checkData, setCheckData] = useState(initCheckData);
 
  //@ts-ignore
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: undefined,
    isError: false,
    data: initialData,
  }) as [DataFetchReducerState<T>, React.Dispatch<DataFetchReducerAction<{}>>];
 
  useEffect(() => {
    let didCancel = false;
 
    const fetchData = async () => {
      if(url !== '') {
        dispatch({ type: 'FETCH_INIT' });
  
        try {
          const result = await fetch(url, fetchOptions);
          const data = (await result.json()) as T;
          // const data = { articles: [], status: 'ok' };
          console.log({reloaded_data: data});
          if (!didCancel) {
            dispatch({ type: 'FETCH_SUCCESS', payload: data });
          }
        } catch (error) {
          if (!didCancel) {
            dispatch({ type: 'FETCH_FAILURE' });
          }
        }
      }
    };
 
    fetchData();
 
    return () => {
      didCancel = true;
    };
  }, [url, checkData]);
 
  return {state, url, setUrl, checkData, setCheckData};
};

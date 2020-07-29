import { Express } from 'express';

export interface LoginUser extends Express {
  id: string,
  username: string
}

export function formatDate(d: Date): string {
  const year = d.getFullYear();
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();

  if (month.length < 2) 
    month = '0' + month;
  if (day.length < 2) 
    day = '0' + day;

  return [year, month, day].join('-');
}

export function formatTime(d: Date): string {
  let hr = '' + d.getHours();
  let min = '' + d.getMinutes();
  let sec = '' + d.getSeconds();
  
  if(hr.length < 2) {
    hr = '0' + hr;
  }
  if(min.length < 2) {
    min = '0' + min;
  }
  if(sec.length < 2) {
    sec = '0' + sec;
  }
  
  return [hr, min, sec].join(':');
}

export function flatten<T>(arr: T[][]): T[] {
  return ([] as T[]).concat.apply([], arr);
}
import { Express } from 'express';

export interface LoginUser extends Express {
  id: string,
  username: string
}

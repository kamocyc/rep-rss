import { app } from './server_app';

//テスト時にこれを呼び出すと、テストが終了しなくなる。
const port = process.env.PORT || '3000';

app.listen(port, ()=> {
  console.log('server running');
});

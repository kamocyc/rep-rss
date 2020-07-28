import { app } from './server_app';

//テスト時にこれを呼び出すと、テストが終了しなくなる。
app.listen(3000, ()=> {
  console.log('server running');
});

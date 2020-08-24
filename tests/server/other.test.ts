import {loadEnv} from '../../src/server/env_loader';
import fs from 'fs';

describe('load_setting', () => {
  test("load_setting", async () => {
    const fileName = "test.env.txt";
    
    //引用符で囲む
    //引用符で囲まない
    //空行は無視
    //コメントは無視
    //行前後のスペースは無視
    //（等号前後のスペースは入れてはいけない）
    //値中のスペースはふくめる
    await fs.promises.writeFile(fileName, `
      KEY1="value1"
      KEY_TWO=value2aaa
      
      # comment
        KEY_3="aa bb cc://;\\"   
      
    `, "utf-8");
    
    const result = loadEnv(fileName);
    
    expect(result).toStrictEqual({
      KEY1: "value1",
      KEY_TWO: "value2aaa",
      KEY_3: "aa bb cc://;\\",
    });
    
    await fs.promises.unlink(fileName);
  });
});

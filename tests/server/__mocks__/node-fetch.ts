
const fetch = jest.fn().mockImplementation((url: string) => {
  return {
    json: () => {
      if(url.indexOf('empty') !== -1) {
        return null;
      }
      
      return {
        eid: "123",
        bookmarks: [{
          user: "user_a",
          timestamp: "2019/09/21 23:40",
          comment: "this is comment (1)."
        },{
          user: "user_b",
          timestamp: "2019/09/21 21:00",
          comment: "this is comment (2)."
        },{
          user: "user_c",
          timestamp: "2019/09/21 21:00",
          comment: ""
        }]
      };
    }
  };
});

export default fetch;

import initApp from "./server";
const port = process.env.PORT;
import https from "https";
import fs from "fs";

initApp().then((app) => {
  if (process.env.NODE_ENV !== "production") {
    app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  }else{
    const props = { 
      key: fs.readFileSync("./client-key.pem"), 
      cert: fs.readFileSync("./client-cert.pem") 
    };
    https.createServer(props, app).listen(port, () => {
      console.log(`Example app listening at https://localhost:${port}`);
    });
  }
});
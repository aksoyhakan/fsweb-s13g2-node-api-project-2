// require your server and launch it here

const server = require("./api/server");

const port = 8000;

server.listen(port, () => {
  console.log(`API running on port ${port}`);
});

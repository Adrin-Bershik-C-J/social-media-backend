const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { init } = require("./utils/socket");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = http.createServer(app); // ← native HTTP wrapper
  init(server); // ← boot Socket.IO

  server.listen(PORT, () => {
    console.log(`REST  +  Socket.IO running on http://localhost:${PORT}`);
  });
});

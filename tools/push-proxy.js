// 本地 HTTPS CONNECT 代理：github.com 固定走可达 IP 140.82.114.3
"use strict";
const http = require("http"), net = require("net");
const PORT = 8899;
const MAP = { "github.com": "140.82.114.3", "api.github.com": "140.82.114.3", "objects.githubusercontent.com": "140.82.114.3", "raw.githubusercontent.com": "140.82.114.3", "codeload.github.com": "140.82.114.3" };
const server = http.createServer((req, res) => { res.writeHead(502); res.end(); });
server.on("connect", (req, client, head) => {
  const [host, port] = req.url.split(":");
  const target = MAP[host] || host;
  const sock = net.connect(parseInt(port || "443", 10), target, () => {
    client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    if (head && head.length) sock.write(head);
    client.pipe(sock).pipe(client);
  });
  sock.on("error", () => client.destroy());
  client.on("error", () => sock.destroy());
});
server.listen(PORT, () => console.log("proxy up on " + PORT));
const express = require("express")
const http = require("http")
const app = express();
const server = http.createServer(app);
const socketIO = require("socket.io");
const moment = require("moment");
const PORT = process.env.PORT || 5000;

corsOptions = {
  cors: true,
  origins: ["http://localhost:3000"],
}
const io = socketIO(server, corsOptions);

let lobby = [];


io.on('connection', (socket) => {
  socket.on("entered", (data) => {
    if (!Object.keys(lobby).includes(data.nickname)) {
      socket.name = data.nickname;
      lobby[socket.name] = socket
      socket.broadcast.emit("newConn", { "name": socket.name });
    }
    socket.emit("enteredSucc", Object.keys(lobby));
  })

  socket.on('disconnect', () => {
    delete lobby[socket.name];
    socket.broadcast.emit("disConn", { "disConnName": socket.name });
  });

  socket.on('chat msg', (msg, sender, receiver, time) => {
    io.to(lobby[receiver].id).emit('chatReceive', { msg: msg, time: moment(new Date()).format("HH:mm A") });
  });
});


server.listen(PORT, () => console.log(`server is running ${PORT}`))
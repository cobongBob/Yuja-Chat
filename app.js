const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const socketIO = require('socket.io');
const moment = require('moment');
const PORT = process.env.PORT || 5000;

corsOptions = {
  cors: true,
  origins: ['http://localhost:3000'],
};
const io = socketIO(server, corsOptions);

let lobby = [];

io.on('connection', (socket) => {
  socket.on('entered', (data) => {
    if (!Object.keys(lobby).includes(data.nickname)) {
      socket.name = data.nickname;
      socket.profilePic = data.profilePic;
      lobby[socket.name] = socket;
      socket.broadcast.emit('newConn', {
        name: socket.name,
        profilePic: data.profilePic || '',
      });
    }
    const newData = [];
    const oriData = Object.keys(lobby);
    for (let i = 0; i < oriData.length; i++) {
      newData.push({
        name: lobby[oriData[i]].name,
        profilePic: lobby[oriData[i]].profilePic,
      });
    }
    socket.emit('enteredSucc', newData);
  });

  socket.on('disconnect', () => {
    delete lobby[socket.name];
    socket.broadcast.emit('disConn', { disConnName: socket.name });
  });

  socket.on('chat msg', (msg, sender, receiver) => {
    if (receiver !== null) {
      io.to(lobby[receiver].id).emit('chatReceive', {
        msg: msg,
        time: moment(new Date()).format('HH:mm A'),
      });
    } else {
      io.to(lobby[sender].id).emit('chatReceive', {
        msg: '유저가 퇴장했습니다',
        time: moment(new Date()).format('HH:mm A'),
      });
    }
  });
});

server.listen(PORT, () => console.log(`server is running ${PORT}`));

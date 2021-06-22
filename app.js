const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const socketIO = require('socket.io');
const PORT = process.env.PORT || 5000;

corsOptions = {
  cors: true,
  origins: ['https://www.withyuja.com'],
  // origins: ['localhost:3000'],
};
const io = socketIO(server, corsOptions);

let lobby = [];

io.on('connection', (socket) => {
  socket.on('entered', (data) => {
    for (const property in lobby) {
      if (lobby[property] && data.id === lobby[property].userId) {
        delete lobby[property];
        socket.broadcast.emit('disConn', { disConnName: property });
        break;
      }
    }
    if (!Object.keys(lobby).includes(data.nickname)) {
      socket.userId = data.id;
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
    if (lobby[socket.receiver]) {
      io.to(lobby[socket.receiver].id).emit('chatReceive', {
        msg: `${socket.name}님이 퇴장했습니다`,
      });
    }
    delete lobby[socket.name];
    socket.broadcast.emit('disConn', { disConnName: socket.name });
  });

  socket.on('logout', (userData, receiver) => {
    if (lobby[socket.name]) {
      if (lobby[receiver]) {
        io.to(lobby[receiver].id).emit('chatReceive', {
          msg: `${socket.name}님이 퇴장했습니다`,
        });
      }
      delete lobby[socket.name];
      socket.broadcast.emit('disConn', { disConnName: socket.name });
    }
  });
  socket.on('quit', (userData, receiver) => {
    if (lobby[receiver]) {
      io.to(lobby[receiver].id).emit('chatReceive', {
        msg: `${userData.nickname}님이 퇴장했습니다`,
      });
    }
  });

  socket.on('chat msg', (msg, sender, receiver) => {
    if (receiver && lobby[receiver] && lobby[receiver].id) {
      if (socket.receiver === receiver) {
        io.to(lobby[receiver].id).emit('chatReceive', {
          sender: sender,
          msg: msg,
        });
      }
    }
  });
  socket.on('chatNoti', (sender, receiver) => {
    if (lobby[receiver] && lobby[sender.nickname]) {
      io.to(lobby[receiver].id).emit('chatNotification', {
        msg: `${sender.nickname}님께서 채팅을 요청하였습니다.`,
        sender: sender,
      });
    }
  });
  socket.on('handshaker', (sender, receiver) => {
    if (lobby[receiver.name] && lobby[sender.nickname]) {
      socket.receiver = receiver.name;
    }
  });
});

server.listen(PORT, () => console.log(`server is running ${PORT}`));

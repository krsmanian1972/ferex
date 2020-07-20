const io = require('socket.io');
const users = require('./lib/users');
const liveSessions = require('./lib/liveSessions');

const fs = require('fs');

const ASSET_DIR = "/Users/harinimaniam/assets";
/**
 * Initialize when a connection is made
 * 
 * @param {SocketIO.Socket} socket
 */
function initSocket(socket) {
  let id;
  socket
    .on('init', async (data) => {
      id = await users.create(socket, data);
      console.log(id);
      socket.emit('token', { id });
    })
    .on('ding', (data) => {
      const ans = users.ping(data);
      socket.emit('answer', ans);
    })
    .on('joinSession', (data) => {
      const advice = liveSessions.joinSession(data, id);
      socket.emit('callAdvice', advice);
    })
    .on('request', (data) => {
      const receiver = users.get(data.to);
      if (receiver) {
        receiver.emit('request', { from: id });
      }
    })
    .on('call', (data) => {
      const receiver = users.get(data.to);
      if (receiver) {
        receiver.emit('call', { ...data, from: id });
      } else {
        socket.emit('failed');
      }
    })
    .on('end', (data) => {
      const receiver = users.get(data.to);
      if (receiver) {
        receiver.emit('end');
      }
    })
    .on('canvasupstream', async (data) => {
      const dir = `${ASSET_DIR}/${data.sessionUserFuzzyId}/board`;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFile(`${dir}/${data.name}`, data.content, err => { if (err) throw err });
    })
    .on('disconnect', () => {
      users.remove(id);
      liveSessions.disconnect(id);
      console.log(id, 'disconnected');
    });


}

module.exports = (server) => {
  io
    .listen(server, { log: true })
    .on('connection', initSocket);
};

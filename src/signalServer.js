const io = require('socket.io');
const users = require('./lib/users');
const liveSessions = require('./lib/liveSessions');

const fs = require('fs');

const SESSION_ASSET_DIR = "/Users/pmpower/assets/sessions";
const PROGRAM_ASSET_DIR = "/Users/pmpower/assets/programs";
const USER_ASSET_DIR = "/Users/pmpower/assets/users";

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
      console.log(advice);
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
      const dir = `${SESSION_ASSET_DIR}/${data.sessionUserFuzzyId}/boards`;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFile(`${dir}/${data.name}`, data.content, err => { if (err) throw err });
    })
    .on('programContent', async (data) => {
      const dir = `${PROGRAM_ASSET_DIR}/${data.fuzzyId}/about`;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFile(`${dir}/${data.name}`, data.content, err => { if (err) throw err });
    })
    .on('userContent', async (data) => {
      const dir = `${USER_ASSET_DIR}/${data.fuzzyId}`;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFile(`${dir}/${data.name}`, data.content, err => { if (err) throw err });
    })
    .on('sessionContent', async (data) => {
      const dir = `${SESSION_ASSET_DIR}/${data.sessionUserFuzzyId}/content`;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFile(`${dir}/${data.fileName}`, data.content, err => { if (err) throw err });
    })
    .on('disconnect', () => {
      users.remove(id);
      liveSessions.disconnect(id);
      console.log(id, 'disconnected');
    });

  /**
   * Find the live sockets created for the "TO" fuzzyId.
   *
   * If any found, dispatch the message to all of them.
   *
   * The Receivers is an implementation of Set.
   */
  socket.on('sendTo', async (data) => {

    const receivers = users.getSockets(data.to);
    for (let receiver of receivers) {
      receiver.emit('feedIn', { feed: data.feed });
    }

  });

  socket.on('usPaint', (data) => {
    const advice = liveSessions.getSessionSocket(data.sessionId);
    for (let [user, socket] of advice.members) {
       const receivers = users.getSockets(user);
       for (let receiver of receivers) {
         if(data.sessionUserFuzzyId === user){
         }
         else{
             receiver.emit('dsPaint', {data: data});
         }
       }
    }
    var guideSocket = users.get(advice.guideSocketId);
    guideSocket.emit('dsPaint', {data: data});
  });

}

module.exports = (server) => {
  io
    .listen(server, { log: true })
    .on('connection', initSocket);
};

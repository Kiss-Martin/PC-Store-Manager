// Shared Socket.io instance holder — set once from index.js, used across services
let _io = null;

export function setIO(io) {
  _io = io;
}

export function getIO() {
  return _io;
}

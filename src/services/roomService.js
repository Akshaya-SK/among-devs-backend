const rooms = require("../state/roomStore")

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function createRoom(socketId, userId, username, language, difficulty) {
  const roomId = generateRoomId()

  rooms[roomId] = {
    id: roomId,

    language,
    difficulty,

    status: "waiting", // waiting | in_progress | ended

    hostId: socketId,
    hackerId: null,

    players: [
      {
        socketId,
        userId,
        username,
        role: null,
        isAlive: true
      }
    ],

    task: null,        // assigned when game starts
    votes: {},         // voterSocketId -> targetSocketId

    timer: {
      startedAt: null,
      duration: 180000 // 3 minutes default
    },

    createdAt: new Date()
  }

  return rooms[roomId]
}

function findRoomBySocketId(socketId) {
  for (const roomId in rooms) {
    const room = rooms[roomId]
    const found = room.players.some(p => p.socketId === socketId)
    if (found) return room
  }
  return null
}

function joinRoom(roomId, socketId, userId, username) {
  const room = rooms[roomId]
  if (!room) throw new Error("Room not found")

  if (room.status !== "waiting")
    throw new Error("Game already started")

  if (room.players.length >= 5)
    throw new Error("Room full")

  room.players.push({
    socketId,
    userId,
    username,
    role: null,
    isAlive: true
  })
  console.log("Player count:", room.players.length)

  return room
}

function leaveRoom(roomId, socketId) {
  const room = rooms[roomId]
  if (!room) return

  room.players = room.players.filter(p => p.socketId !== socketId)

  if (room.hackerId === socketId) {
    room.hackerId = null
  }

  if (room.players.length === 0) {
    console.log("Deleting room:", roomId)
    delete rooms[roomId]
    return null
  }

  if (room.hostId === socketId) {
    room.hostId = room.players[0].socketId
  }

  return room
}

function getRoom(roomId) {
  return rooms[roomId]
}

function joinRandomRoom(socketId, userId, username, language, difficulty) {
  for (const roomId in rooms) {
    const room = rooms[roomId]

    if (
      room.status === "waiting" &&
      room.players.length < 5 &&
      room.language === language &&
      room.difficulty === difficulty
    ) {
      room.players.push({
        socketId,
        userId,
        username,
        role: null,
        isAlive: true
      })

      return room
    }
  }

  // If no match found → create new room
  return createRoom(socketId, userId, username, language, difficulty)
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  findRoomBySocketId,
  joinRandomRoom
}
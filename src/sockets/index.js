const { Server } = require("socket.io")
const roomHandlers = require("./roomHandlers")
const gameHandlers = require("./gameHandlers")
const chatHandlers = require("./chatHandlers")
const roomService = require("../services/roomService")
const gameService = require("../services/gameService")


module.exports = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" }
  })

  setInterval(() => {
    const rooms = require("../state/roomStore")

    for (const roomId in rooms) {
      const room = rooms[roomId]

      // Skip if game not active
      if (room.phase !== "playing" && room.phase !== "voting") continue

      // ⏳ Game timer
      if (room.phase === "playing") {
        const result = gameService.checkWinCondition(room)
        if (result) {
          gameService.endGame(io, room, result)
          continue
        }
      }

      // 🗳 Voting timeout
      if (room.phase === "voting" && room.meeting.startedAt) {
        if (Date.now() - room.meeting.startedAt > room.meeting.duration) {
          gameService.resolveVotes(io, room)
        }
      }
    }
  }, 1000)

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    // Register room-related handlers
    roomHandlers(io, socket)
    gameHandlers(io, socket)
    chatHandlers(io, socket)
    
    // Disconnect handling
    socket.on("disconnect", () => {
      const room = roomService.findRoomBySocketId(socket.id)
      if (!room) return

      const updatedRoom = roomService.leaveRoom(room.id, socket.id)
      if (!updatedRoom) return

      const result = gameService.handlePlayerRemoval(updatedRoom, socket.id)
      console.log("Win check result:", result)

      if (result) {
        gameService.endGame(io, updatedRoom, result)
        return
      }

      io.to(updatedRoom.id).emit("room_update", updatedRoom)
    })
  })
}
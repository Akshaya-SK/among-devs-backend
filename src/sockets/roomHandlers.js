const roomService = require("../services/roomService")
const gameService = require("../services/gameService")
const systemService = require("../services/systemService")


module.exports = (io, socket) => {

  socket.on("create_room", ({ userId, username }) => {
    try {
      const room = roomService.createRoom(socket.id, userId, username)
      socket.join(room.id)
      socket.roomId = room.id

      io.to(room.id).emit("room_update", room)
    } catch (err) {
      socket.emit("error_message", err.message)
    }
  })

  socket.on("join_room", ({ roomId, userId, username }) => {
    try {
      const room = roomService.joinRoom(roomId, socket.id, userId, username)
      socket.join(roomId)
      socket.roomId = room.id

      io.to(roomId).emit("room_update", room)

      if (room.players.length === 5) {
        console.log("AUTO START TRIGGERED")
        const updatedRoom = gameService.initializeGame(roomId)

        // Emit roles privately
        updatedRoom.players.forEach(player => {
          io.to(player.socketId).emit("role_assigned", player.role)
        })

        // Emit global game state
        io.to(roomId).emit("game_started", {
          systems: updatedRoom.systems
        })
      }

    } catch (err) {
      socket.emit("error_message", err.message)
    }
  })

  socket.on("leave_room", ({ roomId }) => {
    const room = roomService.leaveRoom(roomId, socket.id)

    if (!room) return

    io.to(roomId).emit("room_update", room)
  })

}
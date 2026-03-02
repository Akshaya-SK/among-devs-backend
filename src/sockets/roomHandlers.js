const roomService = require("../services/roomService")
const gameService = require("../services/gameService")


module.exports = (io, socket) => {
  const tryStartGame = (room) => {
    if (room.players.length === 5 && room.phase === "lobby") {

      const updatedRoom = gameService.initializeGame(room.id)

      // Emit roles privately
      updatedRoom.players.forEach(player => {
        io.to(player.socketId).emit("role_assigned", player.role)
      })

      // Emit game started
      io.to(updatedRoom.id).emit("game_started", {
        task: updatedRoom.task,
        timer: updatedRoom.timer
      })
    }
  }

  socket.on("join_room", ({ roomId, userId, username }) => {
    try {
      const room = roomService.joinRoom(roomId, socket.id, userId, username)

      socket.join(room.id)
      socket.roomId = room.id

      io.to(room.id).emit("room_update", room)
      socket.emit("chat-history", room.messages)

      tryStartGame(room)

    } catch (err) {
      socket.emit("error_message", err.message)
    }
  })

  socket.on("create_room", ({ userId, username, language, difficulty }) => {
    try {
      const room = roomService.createRoom(socket.id, userId, username, language, difficulty)
      socket.join(room.id)
      socket.roomId = room.id

      io.to(room.id).emit("room_update", room)
    } catch (err) {
      socket.emit("error_message", err.message)
    }
  })

  socket.on("join_random", ({ userId, username, language, difficulty }) => {
    try {
      const room = roomService.joinRandomRoom(
        socket.id,
        userId,
        username,
        language,
        difficulty
      )

      socket.join(room.id)
      socket.roomId = room.id

      io.to(room.id).emit("room_update", room)

      if (room.players.length === 5) {
        tryStartGame(room)
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
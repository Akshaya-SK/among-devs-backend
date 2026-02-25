const systemService = require("../services/systemService")
const roomService = require("../services/roomService")
const gameService = require("../services/gameService")

module.exports = (io, socket) => {

  socket.on("system_interact", ({ systemId }) => {
    const room = roomService.getRoom(socket.roomId)
    if (!room || room.status !== "in_progress") return

    try {
      systemService.lockSystem(room, systemId, socket.id)

      io.to(room.id).emit("system_state_update", room.systems)
    } catch (err) {
      socket.emit("error_message", err.message)
    }
  })

  socket.on("system_fix_attempt", ({ systemId }) => {
    const room = roomService.getRoom(socket.roomId)
    if (!room) return

    const player = room.players.find(p => p.socketId === socket.id)
    if (!player || player.role !== "developer") return

    try {
      systemService.fixSystem(room, systemId, socket.id)

      io.to(room.id).emit("system_state_update", room.systems)

      const result = gameService.checkWinCondition(room)
      if (result) gameService.endGame(io, room, result)

    } catch (err) {
      socket.emit("system_fix_fail", err.message)
    }
  })

  socket.on("system_sabotage", ({ systemId }) => {
    const room = roomService.getRoom(socket.roomId)
    if (!room) return

    const player = room.players.find(p => p.socketId === socket.id)
    if (!player || player.role !== "hacker") return

    try {
      systemService.sabotageSystem(room, systemId, socket.id)

      io.to(room.id).emit("system_state_update", room.systems)

      const result = gameService.checkWinCondition(room)
      if (result) gameService.endGame(io, room, result)

    } catch (err) {
      socket.emit("error_message", err.message)
    }
  })

}
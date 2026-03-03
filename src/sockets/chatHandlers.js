const roomService = require("../services/roomService")
// const gameService = require("../services/gameService")

module.exports = (io, socket) => {
  socket.on("send-message", ({ message }) => {
  const room = roomService.getRoom(socket.roomId)
  if (!room) return

  if (room.phase !== "playing" && room.phase !== "voting" && room.phase !== "lobby") return
  if (room.phase === "results") return

  const player = room.players.find(p => p.socketId === socket.id)
  if (!player || !player.isAlive) return

  if (!message || message.length > 200) return

  const chatMessage = {
    id: Date.now(),
    username: player.username,
    message,
    timestamp: Date.now()
  }

  room.messages.push(chatMessage)

  console.log("Chat from socket:", socket.id)
  console.log("Room ID:", socket.roomId)
  console.log("Players in room:", room.players.map(p => p.socketId))
  console.log("Broadcasting message to room:", room.id)
  io.to(room.id).emit("new-message", chatMessage)
})
}
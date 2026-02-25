const { Server } = require("socket.io")
const roomHandlers = require("./roomHandlers")
const gameHandlers = require("./gameHandlers")
const roomService = require("../services/roomService")


module.exports = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" }
  })

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    // Register room-related handlers
    roomHandlers(io, socket)
    gameHandlers(io, socket)
    
    // Disconnect handling
    socket.on("disconnect", () => {
      // console.log("Block Start User disconnected:", socket.id)

      const room = roomService.findRoomBySocketId(socket.id)
      if (!room) return

      const wasHacker = room.hackerId === socket.id

      const updatedRoom = roomService.leaveRoom(room.id, socket.id)
      if (!updatedRoom) return

      if (updatedRoom.status === "in_progress") {

        const hackerStillAlive = updatedRoom.players.some(
          p => p.role === "hacker"
        )

        const developerCount = updatedRoom.players.filter(
          p => p.role === "developer"
        ).length

        if (!hackerStillAlive) {
          updatedRoom.status = "ended"

          io.to(updatedRoom.id).emit("game_over", {
            winner: "developers",
            reason: "Hacker disconnected"
          })
          return
        }

        if (developerCount === 0) {
          updatedRoom.status = "ended"

          io.to(updatedRoom.id).emit("game_over", {
            winner: "hacker",
            reason: "All developers eliminated"
          })
          return
        }
      }

      io.to(updatedRoom.id).emit("room_update", updatedRoom)
      // console.log("Block End User disconnected:", socket.id)

    })
  })
}
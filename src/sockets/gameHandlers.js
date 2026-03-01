const roomService = require("../services/roomService")
const gameService = require("../services/gameService")
const { validateSubmission } = require("../services/validationService")

module.exports = (io, socket) => {

  // 🔄 Real-time code sync
  socket.on("update_code", ({ code }) => {
    const room = roomService.getRoom(socket.roomId)
    if (!room || room.status !== "in_progress") return

    room.task.currentCode = code
    if (code.trim() === "") {
      room.task.currentCode = room.task.originalCode
      io.to(room.id).emit("code_restored", {
        code: room.task.originalCode
      })
      return
    }
    io.to(room.id).emit("code_updated", {
      code,
      updatedBy: socket.id
    })
  })

  // 🧪 Developer submits fix
  socket.on("submit_code", ({ code }) => {
  const room = roomService.getRoom(socket.roomId)
  if (!room || room.status !== "in_progress") return

  const player = room.players.find(p => p.socketId === socket.id)
  if (!player || player.role !== "developer") return

  const result = validateSubmission(room.task, code)

  if (!result.success) {
    socket.emit("fix_failed", result.reason)
    return
  }

  room.task.status = "fixed"
  room.task.fixedBy = socket.id

  io.to(room.id).emit("task_fixed", {
    by: player.username
  })

  const win = gameService.checkWinCondition(room)
  if (win) gameService.endGame(io, room, win)
 })

  // 🧨 Hacker sabotage
  socket.on("sabotage_task", () => {
  const room = roomService.getRoom(socket.roomId)
  if (!room || room.status !== "in_progress") return

  const player = room.players.find(p => p.socketId === socket.id)
  if (!player || player.role !== "hacker") return

  room.task.status = "broken"
  room.task.sabotagedBy = socket.id
  room.task.attempts = 0

  io.to(room.id).emit("task_sabotaged", {
    by: player.username
  })
})
}


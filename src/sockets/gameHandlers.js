const roomService = require("../services/roomService")
const gameService = require("../services/gameService")
const { validateSubmission } = require("../services/validationService")

module.exports = (io, socket) => {

  // 🔄 Real-time code sync
  socket.on("update_code", ({ code }) => {
    const room = roomService.getRoom(socket.roomId)
    if (!room || room.phase !== "playing") return

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
  if (!room || room.phase !== "playing") return

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
  if (!room || room.phase !== "playing") return

  const player = room.players.find(p => p.socketId === socket.id)
  if (!player || player.role !== "hacker") return

  room.task.status = "broken"
  room.task.sabotagedBy = socket.id
  room.task.attempts = 0

  io.to(room.id).emit("task_sabotaged", {
    by: player.username
  })
})

  socket.on("emergency-meeting", () => {
    const room = roomService.getRoom(socket.roomId)
    if (!room) return
    if (room.phase !== "playing") return
    if (room.phase === "voting") return

    const player = room.players.find(p => p.socketId === socket.id)
    if (!player || !player.isAlive) return
    if (player.hasCalledMeeting) return

    player.hasCalledMeeting = true

    room.phase = "voting"
    room.votes = {}
    room.meeting.startedAt = Date.now()
    room.meeting.calledBy = socket.id

    io.to(room.id).emit("meeting-started", {
      calledBy: player.username
    })
  })



  socket.on("cast-vote", ({ targetSocketId }) => {
    const room = roomService.getRoom(socket.roomId)
    console.log("Votes so far:", Object.keys(room.votes).length)
    console.log("Alive count:", room.players.filter(p => p.isAlive).length)
    if (!room) return
    if (room.phase !== "voting") return
    // if (room.phase !== "playing") return
    

    const voter = room.players.find(p => p.socketId === socket.id)
    if (!voter || !voter.isAlive) return

    if (room.votes[socket.id]) return // no double vote

    // Allow skip by passing null
    if (targetSocketId) {
      const target = room.players.find(p => p.socketId === targetSocketId)
      if (!target || !target.isAlive) return
    }

    room.votes[socket.id] = targetSocketId || "skip"

    const aliveCount = room.players.filter(p => p.isAlive).length

    if (Object.keys(room.votes).length === aliveCount) {
      gameService.resolveVotes(io, room)
    }
  })
}


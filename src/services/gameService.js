const roomService = require("./roomService")
const { pickRandomQuestion } = require("./questionsService")

function initializeGame(roomId) {
  const room = roomService.getRoom(roomId)
  if (!room) throw new Error("Room not found")

  room.status = "in_progress"

  assignRoles(room)

  const question = pickRandomQuestion(
    room.language,
    room.difficulty
  )

  room.task = {
    ...question,
    originalCode: question.buggyCode,
    currentCode: question.buggyCode,
    status: "broken",
    attempts: 0,
    fixedBy: null,
    sabotagedBy: null
  }

  room.timer.startedAt = Date.now()

  return room
}

function assignRoles(room) {
  const shuffled = [...room.players].sort(() => 0.5 - Math.random())

  const hacker = shuffled[0]
  hacker.role = "hacker"
  room.hackerId = hacker.socketId

  for (let i = 1; i < shuffled.length; i++) {
    shuffled[i].role = "developer"
  }
}



function checkWinCondition(room) {
  if (room.status !== "in_progress") return null

  const developerCount = room.players.filter(
    p => p.role === "developer" && p.isAlive
  ).length

  const hackerAlive = room.players.some(
    p => p.role === "hacker" && p.isAlive
  )

  // Developers win if task fixed
  if (room.task.status === "fixed") {
    return { winner: "developers", reason: "Task fixed" }
  }

  // Timer expired → hacker wins
  if (Date.now() - room.timer.startedAt > room.timer.duration) {
    return { winner: "hacker", reason: "Time expired" }
  }

  // Hacker eliminated
  if (!hackerAlive) {
    return { winner: "developers", reason: "Hacker eliminated" }
  }

  // Parity condition
  if (developerCount <= 1 && hackerAlive) {
    return { winner: "hacker", reason: "Hacker reached parity" }
  }

  return null
}

function endGame(io, room, result) {
  room.status = "ended"

  io.to(room.id).emit("game_over", result)
  io.to(room.id).emit("room_update", room)
}

function handlePlayerRemoval(room) {
  if (room.status !== "in_progress") return null
  return checkWinCondition(room)
}


module.exports = {
  initializeGame,
  checkWinCondition,
  endGame,
  handlePlayerRemoval
}

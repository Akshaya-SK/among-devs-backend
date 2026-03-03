const roomService = require("./roomService")
const { pickRandomQuestion } = require("./questionsService")

function initializeGame(roomId) {
  const room = roomService.getRoom(roomId)
  if (!room) throw new Error("Room not found")

  room.phase = "playing"

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
  // console.log("Timer started at:", room.timer.startedAt)

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
  if (room.phase !== "playing") return null

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
  // console.log("Checking timer for room:", room.id)
  // console.log("Elapsed:", Date.now() - room.timer.startedAt)
  // console.log("Duration:", room.timer.duration)
  // Timer expired → hacker wins
  if (Date.now() - room.timer.startedAt > room.timer.duration) {
    console.log("Timer condition met")
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
  room.phase = "ended"

  io.to(room.id).emit("game_over", result)
  io.to(room.id).emit("room_update", room)
}

function handlePlayerRemoval(room) {
  if (room.phase !== "playing") return null
  return checkWinCondition(room)
}

function resolveVotes(io, room) {
  const tally = {}
  console.log("Resolving votes for room:", room.id)

  for (const voter in room.votes) {
    const target = room.votes[voter]
    tally[target] = (tally[target] || 0) + 1
  }

  let maxVotes = 0
  let eliminated = null
  let tie = false

  for (const target in tally) {
    if (tally[target] > maxVotes) {
      maxVotes = tally[target]
      eliminated = target
      tie = false
    } else if (tally[target] === maxVotes) {
      tie = true
    }
  }

  if (!tie && eliminated && eliminated !== "skip") {
    const player = room.players.find(
      p => p.socketId === eliminated
    )
    if (player) player.isAlive = false
  } else {
    eliminated = null
  }

  room.phase = "playing"
  room.votes = {}
  room.meeting.startedAt = null

  io.to(room.id).emit("vote_result", { eliminated })

  const result = checkWinCondition(room)
  if (result) {
    endGame(io, room, result)
  }
}


module.exports = {
  initializeGame,
  checkWinCondition,
  endGame,
  handlePlayerRemoval,
  resolveVotes
}

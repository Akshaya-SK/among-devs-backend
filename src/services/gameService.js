const roomService = require("./roomService")

function initializeGame(roomId) {
  const room = roomService.getRoom(roomId)
  console.log("initializeGame called for:", roomId)

  if (!room) throw new Error("Room not found")

  room.status = "in_progress"

  assignRoles(room)

  room.systems = generateSystems()

  randomizeBrokenSystems(room.systems)  // initializing broken systems

  return room
}

function randomX() {
  return Math.floor(Math.random() * 1000)
}

function randomY() {
  return Math.floor(Math.random() * 600)
}

function generateSystems() {
  const systems = []

  for (let i = 1; i <= 10; i++) {
    systems.push({
      id: i,
      location: {
        x: Math.floor(Math.random() * 1000),
        y: Math.floor(Math.random() * 600)
      },
      status: "healthy",
      errorType: null,
      isBeingUsed: false,
      lastUpdatedBy: null,
      cooldownUntil: null
    })
  }

  return systems
}


function randomizeBrokenSystems(systems) {
  const shuffled = systems.sort(() => 0.5 - Math.random())
  const broken = shuffled.slice(0, 5)

  const errorTypes = ["syntax", "logic", "infinite_loop", "merge_conflict"]

  broken.forEach(system => {
    system.status = "broken"
    system.errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)]
  })
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
  const brokenCount = room.systems.filter(s => s.status === "broken").length

  const developerCount = room.players.filter(
    p => p.role === "developer"
  ).length

  const hackerAlive = room.players.some(
    p => p.role === "hacker"
  )

  if (!hackerAlive) {
    return { winner: "developers", reason: "Hacker eliminated" }
  }

  if (developerCount === 0) {
    return { winner: "hacker", reason: "All developers eliminated" }
  }

  if (brokenCount === 0) {
    return { winner: "developers", reason: "All systems fixed" }
  }

  if (brokenCount >= 7) {
    return { winner: "hacker", reason: "Too many systems broken" }
  }

  return null
}

function endGame(io, room, result) {
  room.status = "ended"

  io.to(room.id).emit("game_over", result)
}


module.exports = {
  initializeGame,
  randomizeBrokenSystems,
  checkWinCondition,
  endGame
}

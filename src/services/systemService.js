function randomError() {
  const errors = ["syntax", "logic", "runtime", "infinite_loop"]
  return errors[Math.floor(Math.random() * errors.length)]
}

function lockSystem(room, systemId, socketId) {
  const system = room.systems.find(s => s.id === systemId)
  if (!system) throw new Error("System not found")

  if (system.isBeingUsed)
    throw new Error("System already in use")

  if (system.cooldownUntil && Date.now() < system.cooldownUntil)
    throw new Error("System on cooldown")

  system.isBeingUsed = true
  system.lastUpdatedBy = socketId

  return system
}

function unlockSystem(room, systemId) {
  const system = room.systems.find(s => s.id === systemId)
  if (!system) return

  system.isBeingUsed = false
}

function fixSystem(room, systemId, socketId) {
  const system = room.systems.find(s => s.id === systemId)
  if (!system) throw new Error("System not found")

  if (system.status !== "broken")
    throw new Error("System already healthy")

  system.status = "healthy"
  system.errorType = null
  system.isBeingUsed = false
  system.lastUpdatedBy = socketId
  system.cooldownUntil = Date.now() + 5000

  return system
}

function sabotageSystem(room, systemId, socketId) {
  const system = room.systems.find(s => s.id === systemId)
  if (!system) throw new Error("System not found")

  if (system.status === "broken")
    throw new Error("System already broken")

  system.status = "broken"
  system.errorType = randomError()
  system.lastUpdatedBy = socketId
  system.cooldownUntil = Date.now() + 5000

  return system
}

function countBrokenSystems(room) {
  return room.systems.filter(s => s.status === "broken").length
}

function countFixedSystems(room) {
  return room.systems.filter(s => s.status === "healthy").length
}

module.exports = {
  randomError,
  lockSystem,
  unlockSystem,
  fixSystem,
  sabotageSystem,
  countBrokenSystems,
  countFixedSystems
}
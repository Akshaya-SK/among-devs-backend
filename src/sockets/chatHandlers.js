socket.on("send-message", ({ message }) => {
  const room = roomService.getRoom(socket.roomId)
  if (!room) return

  // ❌ No chat after game ends
  if (room.phase === "results") return

  const player = room.players.find(p => p.socketId === socket.id)
  if (!player) return

  // ❌ Dead players cannot chat
  if (!player.isAlive) return

  // Validation
  if (!message || typeof message !== "string") return
  if (message.trim().length === 0) return
  if (message.length > 200) return

  const chatMessage = {
    sender: player.username,
    socketId: socket.id,
    message: message.trim(),
    timestamp: Date.now()
  }

  room.messages.push(chatMessage)

  io.to(room.id).emit("new-message", chatMessage)
})
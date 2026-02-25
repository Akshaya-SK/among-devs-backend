const { io } = require("socket.io-client")

const socket = io("http://localhost:5000")

socket.on("connect", () => {
  console.log("Connected:", socket.id)

  socket.emit("create_session", { username: "User1" })

  socket.on("session_created", (data) => {
    console.log("Session Created:", data)
  })

  socket.on("player_list_update", (players) => {
    console.log("Players:", players)
  })

  socket.on("role_assigned", (data) => {
    console.log("My Role:", data.role)
  })

  socket.on("game_started", (data) => {
    console.log("Game Started:", data)
  })
})

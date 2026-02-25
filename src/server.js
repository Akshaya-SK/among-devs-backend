require("dotenv").config()

const express = require("express")
const http = require("http")
const cors = require("cors")

const connectDB = require("./config/db")
const socketConfig = require("./sockets")
const authRoutes = require("./routes/authRoutes")
const authMiddleware = require("./middleware/authMiddleware")

// 1️⃣ Initialize app FIRST
const app = express()
const server = http.createServer(app)

// 2️⃣ Connect DB
connectDB()

// 3️⃣ Middlewares
app.use(cors())
app.use(express.json())

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "You are authenticated", user: req.user })
})

// 4️⃣ Routes
app.use("/api/auth", authRoutes)

app.get("/", (req, res) => {
  res.send("AmongDevs Backend Running")
})

// 5️⃣ Socket
socketConfig(server)

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

async function register({ username, email, password }) {
  const existing = await User.findOne({
    $or: [{ email }, { username }]
  })

  if (existing) {
    throw new Error("User already exists")
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await User.create({
    username,
    email,
    passwordHash
  })

  return user
}

async function login({ email, password }) {
  const user = await User.findOne({ email })
  if (!user) throw new Error("Invalid credentials")

  const isMatch = await bcrypt.compare(password, user.passwordHash)
  if (!isMatch) throw new Error("Invalid credentials")

  const token = jwt.sign(
    { userId: user._id },
    JWT_SECRET,
    { expiresIn: "7d" }
  )

  return { user, token }
}

module.exports = { register, login }
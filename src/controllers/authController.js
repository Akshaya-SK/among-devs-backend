const authService = require("../services/authService")

async function register(req, res) {
  try {
    await authService.register(req.body)
    res.status(200).json({ message: "User registered successfully" })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

async function login(req, res) {
  try {
    const { user, token } = await authService.login(req.body)

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        stats: user.stats
      },
      token
    })

  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

module.exports = { register, login }
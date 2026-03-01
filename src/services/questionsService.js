const questions = require("../data/questions")

function pickRandomQuestion(language, difficulty) {
  const filtered = questions.filter(
    q => q.language === language && q.difficulty === difficulty
  )

  if (filtered.length === 0)
    throw new Error("No questions found for this config")

  const index = Math.floor(Math.random() * filtered.length)

  // IMPORTANT: clone so you don’t mutate original
  return JSON.parse(JSON.stringify(filtered[index]))
}

module.exports = { pickRandomQuestion }
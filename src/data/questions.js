module.exports = [
  {
    id: 1,
    language: "python",
    difficulty: "easy",
    visibleDescription: "Fix the function to return square of a number.",
    buggyCode: `
def square(n):
    return n * n + 1
print(square(int(input())))
`,
    hiddenTestCases: [
      { input: "2", expectedOutput: "4" },
      { input: "5", expectedOutput: "25" },
      { input: "10", expectedOutput: "100" }
    ]
  },
  {
    id: 2,
    language: "javascript",
    difficulty: "easy",
    visibleDescription: "Return square of a number.",
    buggyCode: `
function square(n) {
  return n * n + 1;
}

const input = parseInt(process.argv[2]);
console.log(square(input));
`,
    hiddenTestCases: [
      { input: "2", expectedOutput: "4" },
      { input: "5", expectedOutput: "25" },
      { input: "10", expectedOutput: "100" }
    ]
  }
]


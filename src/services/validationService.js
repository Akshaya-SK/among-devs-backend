const vm = require("vm")

function normalizeOutput(output) {
  return String(output).trim().replace(/\r\n/g, "\n")
}

function runCode(userCode, input) {
  let output = ""

  const sandbox = {
    console: {
      log: (value) => {
        output += value + "\n"
      }
    },
    process: {
      argv: ["node", "script.js", input]
    }
  }

  vm.createContext(sandbox)

  try {
    vm.runInContext(userCode, sandbox, {
      timeout: 1000
    })
  } catch (err) {
    return { error: err.message }
  }

  return { output: normalizeOutput(output) }
}

function validateSubmission(task, userCode) {
  for (const test of task.hiddenTestCases) {
    const result = runCode(userCode, test.input)

    if (result.error) {
      return {
        success: false,
        reason: "Runtime error"
      }
    }

    if (normalizeOutput(result.output) !== normalizeOutput(test.expectedOutput)) {
      return {
        success: false,
        reason: "Wrong output"
      }
    }
  }

  return { success: true }
}

module.exports = { validateSubmission }

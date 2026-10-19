/**
 * Minimal check reporter shared by the headless scripts.
 */
export function createReporter(title) {
  let passed = 0
  let failed = 0
  console.log(title)
  return {
    check(name, condition, detail = '') {
      if (condition) {
        passed += 1
        console.log(`  ok   ${name}`)
      } else {
        failed += 1
        console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`)
      }
    },
    finish() {
      console.log(`\n${passed} passed, ${failed} failed`)
      if (failed > 0) process.exitCode = 1
      return { passed, failed }
    }
  }
}

import '@testing-library/jest-dom/vitest'
import { afterEach, expect } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as axeMatchers from 'vitest-axe/matchers'

// vitest-axe@0.1.0's own `vitest-axe/extend-expect` entrypoint ships an empty
// dist file, so the matcher is registered manually here instead. Its
// `matchers` entrypoint re-exports `toHaveNoViolations` in a way TypeScript
// reads as type-only under `verbatimModuleSyntax`, so the namespace is passed
// to `expect.extend` and cast once, rather than importing the name directly.
expect.extend(axeMatchers as unknown as Parameters<typeof expect.extend>[0])

afterEach(() => {
  cleanup()
})

// jsdom does not implement matchMedia; MUI's theme/CssBaseline query it.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// jsdom does not implement scrollTo on elements; DurationWheel calls it on click/selection sync.
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo() {}
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkForHtmlHead } from '../src/html'

describe('checkForHtmlHead', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => warn.mockRestore())

  it('returns the html untouched and silent when </head> exists', () => {
    const html = '<html><head></head><body></body></html>'
    expect(checkForHtmlHead(html)).toBe(html)
    expect(warn).not.toHaveBeenCalled()
  })

  it('adds an empty <head> before <body> and warns when only </head> is missing', () => {
    const result = checkForHtmlHead('<html><body></body></html>')
    expect(result).toBe('<html><head>\n</head>\n<body></body></html>')
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('</head> not found in the html')
  })

  it('returns the html untouched and warns when neither </head> nor <body> exist', () => {
    const html = '<div>fragment</div>'
    expect(checkForHtmlHead(html)).toBe(html)
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('will not be injected')
  })
})

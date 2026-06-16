import { describe, it, expect, vi } from 'vitest'
import {
  formatImportBatchSummary,
  importSummaryLinesFromStrings,
  runSequentialImports,
  type AdminImportPayload,
} from './sequentialFileImport'

function file(name: string): File {
  return new File(['x'], name, { type: 'text/csv' })
}

describe('runSequentialImports', () => {
  it('imports multiple files sequentially and sums created counts', async () => {
    const calls: string[] = []
    const importOne = vi.fn(async (f: File): Promise<AdminImportPayload> => {
      calls.push(f.name)
      if (f.name === 'a.csv') return { created: 2 }
      if (f.name === 'b.csv') return { created: 3 }
      return { created: 0 }
    })

    const { lines, totalCreated } = await runSequentialImports(
      [file('a.csv'), file('b.csv')],
      importOne,
    )

    expect(calls).toEqual(['a.csv', 'b.csv'])
    expect(importOne).toHaveBeenCalledTimes(2)
    expect(totalCreated).toBe(5)
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/^a\.csv:/)
    expect(lines[1]).toMatch(/^b\.csv:/)
  })

  it('continues after a per-file failure and records error in summary line', async () => {
    const importOne = vi.fn(async (f: File): Promise<AdminImportPayload> => {
      if (f.name === 'bad.csv') throw new Error('Network error')
      return { created: 1 }
    })

    const { lines, totalCreated } = await runSequentialImports(
      [file('ok.csv'), file('bad.csv'), file('ok2.csv')],
      importOne,
    )

    expect(importOne).toHaveBeenCalledTimes(3)
    expect(totalCreated).toBe(2)
    expect(lines[0]).toMatch(/^ok\.csv:/)
    expect(lines[1]).toMatch(/^bad\.csv:/)
    expect(lines[1].toLowerCase()).toMatch(/couldn|import failed|network/i)
    expect(lines[2]).toMatch(/^ok2\.csv:/)
  })

  it('includes row errors snippet when API returns errors array', async () => {
    const importOne = vi.fn(async (): Promise<AdminImportPayload> => ({
      created: 1,
      errors: ['row 2: missing title', 'row 5: invalid price', 'row 9: dup', 'row 12: bad slug'],
    }))

    const { lines } = await runSequentialImports([file('one.csv')], importOne)
    expect(lines[0]).toContain('row 2: missing title')
    expect(lines[0]).not.toContain('row 12')
    expect(lines[0]).toContain('…')
  })

  it('emits batch progress and clears it when done', async () => {
    const progress: Array<{ overallPercent: number } | null> = []
    await runSequentialImports(
      [file('a.csv'), file('b.csv')],
      async () => ({ created: 0 }),
      (p) => progress.push(p ? { overallPercent: p.overallPercent } : null),
    )

    expect(progress.length).toBeGreaterThan(2)
    expect(progress[progress.length - 1]).toBeNull()
    const nonNull = progress.filter((p) => p != null) as { overallPercent: number }[]
    expect(nonNull[0]!.overallPercent).toBe(0)
    expect(nonNull[nonNull.length - 1]!.overallPercent).toBe(100)
  })

  it('passes onUploadProgress to importOne', async () => {
    const importOne = vi.fn(async (_f: File, ctx) => {
      expect(ctx.onUploadProgress).toBeTypeOf('function')
      ctx.onUploadProgress?.({ loaded: 50, total: 100 } as import('axios').AxiosProgressEvent)
      return { created: 0 }
    })

    await runSequentialImports([file('a.csv')], importOne)
    expect(importOne).toHaveBeenCalledOnce()
  })
})

describe('formatImportBatchSummary', () => {
  it('joins per-file lines with file count prefix', () => {
    const summary = formatImportBatchSummary(2, ['a.csv: 1 added', 'b.csv: 2 added'])
    expect(summary).toMatch(/2 file/)
    expect(summary).toContain('a.csv:')
    expect(summary).toContain('b.csv:')
  })

  it('returns empty string when no lines', () => {
    expect(formatImportBatchSummary(0, [])).toBe('')
  })
})

describe('importSummaryLinesFromStrings', () => {
  it('parses filename prefix into label and marks failures', () => {
    const lines = importSummaryLinesFromStrings([
      'good.csv: 3 added',
      'bad.csv: Couldn’t import this file',
    ])
    expect(lines[0]).toEqual({ label: 'good.csv', text: '3 added', ok: true })
    expect(lines[1]?.ok).toBe(false)
    expect(lines[1]?.label).toBe('bad.csv')
  })
})

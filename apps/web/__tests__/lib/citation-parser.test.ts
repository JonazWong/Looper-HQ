/**
 * Tests for HK Case Number Parser & Neutral Citation Parser
 */
import { describe, it, expect } from 'vitest'
import {
  extractCaseNumbers,
  parseCaseNumber,
  extractNeutralCitations,
  NEUTRAL_CITATION_REGEX,
} from '@/lib/case-linking/case-number-parser'

describe('extractCaseNumbers', () => {
  it('should extract a standard HK case number', () => {
    const result = extractCaseNumbers('See HCAL 123/2024 for details.')
    expect(result).toHaveLength(1)
    expect(result[0].fullNumber).toBe('HCAL 123/2024')
    expect(result[0].courtCode).toBe('HCAL')
    expect(result[0].year).toBe('2024')
  })

  it('should extract multiple case numbers from text', () => {
    const text = 'Comparing FACV 1/2023 with DCCC 100/2022 and HCA 55/2024.'
    const result = extractCaseNumbers(text)
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.courtCode)).toEqual(['FACV', 'DCCC', 'HCA'])
  })

  it('should return empty array when no case numbers found', () => {
    expect(extractCaseNumbers('No case numbers here.')).toHaveLength(0)
  })

  it('should not match unknown court codes', () => {
    const result = extractCaseNumbers('XYZ 123/2024')
    expect(result).toHaveLength(0)
  })
})

describe('parseCaseNumber', () => {
  it('should parse a valid case number', () => {
    const info = parseCaseNumber('HCMP 456/2024')
    expect(info).not.toBeNull()
    expect(info?.courtCode).toBe('HCMP')
    expect(info?.caseSequence).toBe('456')
    expect(info?.year).toBe('2024')
  })

  it('should return null for invalid input', () => {
    expect(parseCaseNumber('INVALID')).toBeNull()
    expect(parseCaseNumber('')).toBeNull()
  })
})

describe('extractNeutralCitations', () => {
  it('should extract a HK neutral citation', () => {
    const result = extractNeutralCitations('See [2024] HKCFA 1 for the leading authority.')
    expect(result).toHaveLength(1)
    expect(result[0].fullCitation).toBe('[2024] HKCFA 1')
    expect(result[0].year).toBe('2024')
    expect(result[0].court).toBe('HKCFA')
    expect(result[0].number).toBe('1')
  })

  it('should extract multiple neutral citations', () => {
    const text = 'Citing [2024] HKCFA 1 and [2023] HKCA 15 and [2022] HKCFI 88.'
    const result = extractNeutralCitations(text)
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.court)).toEqual(['HKCFA', 'HKCA', 'HKCFI'])
  })

  it('should include hkliiPath for known courts', () => {
    const result = extractNeutralCitations('[2024] HKCFA 1')
    expect(result[0].hkliiPath).toBe('hk/cases/hkcfa')
  })

  it('should include hkliiPath for HKDC', () => {
    const result = extractNeutralCitations('[2024] HKDC 5')
    expect(result[0].hkliiPath).toBe('hk/cases/hkdc')
  })

  it('should return empty array when no neutral citations found', () => {
    expect(extractNeutralCitations('no citations here')).toHaveLength(0)
  })

  it('NEUTRAL_CITATION_REGEX should match the expected format', () => {
    const regex = new RegExp(NEUTRAL_CITATION_REGEX.source, 'g')
    const text = 'Reference: [2024] HKCFI 42'
    const matches = Array.from(text.matchAll(regex))
    expect(matches).toHaveLength(1)
  })
})

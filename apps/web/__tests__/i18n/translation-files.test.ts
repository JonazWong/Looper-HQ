import { describe, it, expect } from 'vitest'
import zhMessages from '@/messages/zh.json'
import enMessages from '@/messages/en.json'

describe('Translation Files', () => {
  describe('Structure Consistency', () => {
    it('should have the same top-level keys in both zh and en', () => {
      const zhKeys = Object.keys(zhMessages).sort()
      const enKeys = Object.keys(enMessages).sort()
      
      expect(zhKeys).toEqual(enKeys)
    })

    it('should have common section in both languages', () => {
      expect(zhMessages).toHaveProperty('common')
      expect(enMessages).toHaveProperty('common')
    })

    it('should have nav section in both languages', () => {
      expect(zhMessages).toHaveProperty('nav')
      expect(enMessages).toHaveProperty('nav')
    })

    it('should have case section in both languages', () => {
      expect(zhMessages).toHaveProperty('case')
      expect(enMessages).toHaveProperty('case')
    })

    it('should have auth section in both languages', () => {
      expect(zhMessages).toHaveProperty('auth')
      expect(enMessages).toHaveProperty('auth')
    })

    it('should have dashboard section in both languages', () => {
      expect(zhMessages).toHaveProperty('dashboard')
      expect(enMessages).toHaveProperty('dashboard')
    })
  })

  describe('Common Section', () => {
    it('should have appName in both languages', () => {
      expect(zhMessages.common.appName).toBe('Looper HQ')
      expect(enMessages.common.appName).toBe('Looper HQ')
    })

    it('should have search translation', () => {
      expect(zhMessages.common.search).toBe('搜尋')
      expect(enMessages.common.search).toBe('Search')
    })

    it('should have save translation', () => {
      expect(zhMessages.common.save).toBe('儲存')
      expect(enMessages.common.save).toBe('Save')
    })

    it('should have loading translation', () => {
      expect(zhMessages.common.loading).toBe('載入中...')
      expect(enMessages.common.loading).toBe('Loading...')
    })
  })

  describe('Navigation Section', () => {
    it('should have home translation', () => {
      expect(zhMessages.nav.home).toBe('首頁')
      expect(enMessages.nav.home).toBe('Home')
    })

    it('should have dashboard translation', () => {
      expect(zhMessages.nav.dashboard).toBe('儀表板')
      expect(enMessages.nav.dashboard).toBe('Dashboard')
    })

    it('should have cases translation', () => {
      expect(zhMessages.nav.cases).toBe('案例管理')
      expect(enMessages.nav.cases).toBe('Cases')
    })
  })

  describe('Case Section', () => {
    it('should have title translation', () => {
      expect(zhMessages.case.title).toBe('案例標題')
      expect(enMessages.case.title).toBe('Case Title')
    })

    it('should have category translation', () => {
      expect(zhMessages.case.category).toBe('類別')
      expect(enMessages.case.category).toBe('Category')
    })

    it('should have court translation', () => {
      expect(zhMessages.case.court).toBe('法院')
      expect(enMessages.case.court).toBe('Court')
    })

    it('should have case statuses', () => {
      expect(zhMessages.case.statuses).toBeDefined()
      expect(enMessages.case.statuses).toBeDefined()
      
      expect(zhMessages.case.statuses.ACTIVE).toBe('進行中')
      expect(enMessages.case.statuses.ACTIVE).toBe('Active')
    })

    it('should have case categories', () => {
      expect(zhMessages.case.categories).toBeDefined()
      expect(enMessages.case.categories).toBeDefined()
      
      expect(zhMessages.case.categories.CIVIL).toBe('民事')
      expect(enMessages.case.categories.CIVIL).toBe('Civil')
    })
  })

  describe('Authentication Section', () => {
    it('should have login translation', () => {
      expect(zhMessages.auth.login).toBe('登入')
      expect(enMessages.auth.login).toBe('Login')
    })

    it('should have register translation', () => {
      expect(zhMessages.auth.register).toBe('註冊')
      expect(enMessages.auth.register).toBe('Register')
    })

    it('should have email translation', () => {
      expect(zhMessages.auth.email).toBe('電郵')
      expect(enMessages.auth.email).toBe('Email')
    })
  })
})

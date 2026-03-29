#!/usr/bin/env tsx
/**
 * AI分類器測試工具
 * 
 * 用於測試和驗證案件分類邏輯的準確性
 * 
 * 使用方法:
 *   pnpm tsx .github/skills/legal-system-feature-dev/scripts/test-classifier.ts
 *   pnpm tsx .github/skills/legal-system-feature-dev/scripts/test-classifier.ts test-cases.json
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Test cases
const DEFAULT_TEST_CASES = [
  {
    title: 'HKSAR v. Chan Tai Man',
    summary: '被告涉嫌以虛假投資計劃詐騙八名受害者共$2,000,000',
    expected: {
      category: 'CRIMINAL',
      subcategory: 'FRAUD'
    }
  },
  {
    title: 'HCCT 123/2023 ABC Co. v. XYZ Ltd.',
    summary: '原告指被告違反供應合約，拖欠貨款$500,000',
    expected: {
      category: 'CIVIL',
      subcategory: 'CONTRACT'
    }
  },
  {
    title: '王大明 訴 李小芳 (離婚訴訟)',
    summary: '原告申請離婚並要求撫養權及贍養費',
    expected: {
      category: 'FAMILY',
      subcategory: 'DIVORCE'
    }
  },
  {
    title: 'HCAL 456/2024 申請人 甲公司',
    summary: '申請人就政府決定拒絕其牌照申請提出司法覆核',
    expected: {
      category: 'ADMINISTRATIVE',
      subcategory: 'JUDICIAL_REVIEW'
    }
  },
  {
    title: '關於已故陳先生的遺產',
    summary: '申請人申請遺囑認證，遺產總值約$10,000,000',
    expected: {
      category: 'PROBATE',
      subcategory: 'ESTATE'
    }
  },
  {
    title: 'Crypto Exchange Ltd v. Customer A',
    summary: '原告指被告在比特幣交易中違約，要求賠償損失',
    expected: {
      category: 'CIVIL',
      subcategory: 'CONTRACT'
    },
    notes: '測試新興加密貨幣案件分類'
  },
  {
    title: 'HKSAR v. Wong Siu Ming (交通意外)',
    summary: '被告被控危險駕駛導致他人身體受傷',
    expected: {
      category: 'CRIMINAL',
      subcategory: 'TRAFFIC'
    }
  },
  {
    title: '僱員 A 訴 B公司 (不當解僱)',
    summary: '原告指被告公司在沒有合理理由下終止僱傭合約',
    expected: {
      category: 'EMPLOYMENT',
      subcategory: 'WRONGFUL_DISMISSAL'
    }
  }
]

interface TestCase {
  title: string
  summary: string
  expected: {
    category: string
    subcategory?: string
  }
  notes?: string
}

interface TestResult {
  case: TestCase
  result: {
    category: string
    subcategory?: string
    court?: string
    confidence: number
  }
  passed: boolean
  errors: string[]
}

// Mock classifier - 在實際使用時替換為真實的分類器
async function mockClassifier(caseData: { title: string; summary: string }) {
  // 模擬分類邏輯（簡化版）
  const { title, summary } = caseData
  const text = `${title} ${summary}`.toLowerCase()
  
  let category = 'UNKNOWN'
  let subcategory = undefined
  let confidence = 0.5
  let court = undefined
  
  // 刑事案件
  if (text.includes('hksar v') || text.includes('被告') && text.includes('罪')) {
    category = 'CRIMINAL'
    confidence = 0.9
    
    if (text.includes('詐騙') || text.includes('fraud')) {
      subcategory = 'FRAUD'
      confidence = 0.95
    } else if (text.includes('交通') || text.includes('駕駛')) {
      subcategory = 'TRAFFIC'
      confidence = 0.9
    }
  }
  
  // 民事案件
  else if (text.includes('v.') || text.includes('訴') && text.includes('合約')) {
    category = 'CIVIL'
    confidence = 0.85
    
    if (text.includes('合約') || text.includes('contract') || text.includes('違反')) {
      subcategory = 'CONTRACT'
      confidence = 0.9
    }
  }
  
  // 家事案件
  else if (text.includes('離婚') || text.includes('divorce') || text.includes('撫養')) {
    category = 'FAMILY'
    subcategory = 'DIVORCE'
    confidence = 0.95
  }
  
  // 遺產案件
  else if (text.includes('遺產') || text.includes('estate') || text.includes('遺囑')) {
    category = 'PROBATE'
    subcategory = 'ESTATE'
    confidence = 0.9
  }
  
  // 行政案件
  else if (text.includes('司法覆核') || text.includes('judicial review') || text.includes('hcal')) {
    category = 'ADMINISTRATIVE'
    subcategory = 'JUDICIAL_REVIEW'
    confidence = 0.9
  }
  
  // 僱傭案件
  else if (text.includes('僱') || text.includes('employment') || text.includes('解僱')) {
    category = 'EMPLOYMENT'
    confidence = 0.85
    
    if (text.includes('不當解僱') || text.includes('wrongful')) {
      subcategory = 'WRONGFUL_DISMISSAL'
      confidence = 0.9
    }
  }
  
  // 法院識別
  if (text.includes('hcct') || text.includes('高院')) {
    court = 'HIGH_COURT'
  } else if (text.includes('dcct')) {
    court = 'DISTRICT_COURT'
  }
  
  return {
    category,
    subcategory,
    court,
    confidence
  }
}

function testCase(testCase: TestCase): TestResult {
  const errors: string[] = []
  
  // 這裡應該調用實際的分類器
  // 為了演示，使用mock
  const result = await mockClassifier({
    title: testCase.title,
    summary: testCase.summary
  })
  
  // 檢查類別
  if (result.category !== testCase.expected.category) {
    errors.push(
      `類別錯誤: 預期 ${testCase.expected.category}, 得到 ${result.category}`
    )
  }
  
  // 檢查子類別（如果有期望值）
  if (testCase.expected.subcategory && 
      result.subcategory !== testCase.expected.subcategory) {
    errors.push(
      `子類別錯誤: 預期 ${testCase.expected.subcategory}, 得到 ${result.subcategory || 'undefined'}`
    )
  }
  
  // 檢查信心度
  if (result.confidence < 0.7) {
    errors.push(
      `信心度過低: ${result.confidence.toFixed(2)} < 0.70`
    )
  }
  
  return {
    case: testCase,
    result,
    passed: errors.length === 0,
    errors
  }
}

async function runTests(testCases: TestCase[]) {
  console.log('🧪 AI分類器測試')
  console.log('='.repeat(60))
  console.log('')
  
  const results: TestResult[] = []
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    console.log(`測試 ${i + 1}/${testCases.length}: ${testCase.title}`)
    
    const result = await testCase(testCase)
    results.push(result)
    
    if (result.passed) {
      console.log(`  ✅ 通過 (${result.result.category}/${result.result.subcategory || 'N/A'}, 信心度: ${result.result.confidence.toFixed(2)})`)
    } else {
      console.log(`  ❌ 失敗`)
      result.errors.forEach(error => {
        console.log(`     • ${error}`)
      })
    }
    
    if (testCase.notes) {
      console.log(`     註: ${testCase.notes}`)
    }
    
    console.log('')
  }
  
  // 統計
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const accuracy = (passed / results.length * 100).toFixed(1)
  
  console.log('='.repeat(60))
  console.log('📊 測試結果')
  console.log('='.repeat(60))
  console.log(`總測試數: ${results.length}`)
  console.log(`通過: ${passed} (${accuracy}%)`)
  console.log(`失敗: ${failed} (${(100 - parseFloat(accuracy)).toFixed(1)}%)`)
  console.log('')
  
  // 詳細失敗案例
  if (failed > 0) {
    console.log('❌ 失敗案例詳情:')
    console.log('')
    
    results
      .filter(r => !r.passed)
      .forEach((result, index) => {
        console.log(`${index + 1}. ${result.case.title}`)
        console.log(`   預期: ${result.case.expected.category}/${result.case.expected.subcategory || 'N/A'}`)
        console.log(`   實際: ${result.result.category}/${result.result.subcategory || 'N/A'}`)
        console.log(`   信心度: ${result.result.confidence.toFixed(2)}`)
        result.errors.forEach(error => {
          console.log(`   • ${error}`)
        })
        console.log('')
      })
  }
  
  // 信心度分析
  const avgConfidence = results.reduce((sum, r) => sum + r.result.confidence, 0) / results.length
  const lowConfidence = results.filter(r => r.result.confidence < 0.7)
  
  console.log('📈 信心度分析:')
  console.log(`平均信心度: ${avgConfidence.toFixed(2)}`)
  console.log(`低信心度案例 (<0.7): ${lowConfidence.length}`)
  
  if (lowConfidence.length > 0) {
    lowConfidence.forEach(r => {
      console.log(`  • ${r.case.title}: ${r.result.confidence.toFixed(2)}`)
    })
  }
  console.log('')
  
  // 建議
  if (failed > 0 || lowConfidence.length > 0) {
    console.log('💡 改進建議:')
    console.log('')
    
    if (failed > 0) {
      console.log('  • 檢查分類prompt是否包含失敗案例的特徵')
      console.log('  • 添加更多few-shot examples')
      console.log('  • 考慮添加前置規則檢查')
    }
    
    if (lowConfidence.length > 0) {
      console.log('  • 低信心度案例可能需要更具體的描述')
      console.log('  • 考慮使用更強大的模型（如GPT-4）')
      console.log('  • 添加domain-specific keywords')
    }
    console.log('')
  }
  
  // 保存結果
  const reportPath = join(process.cwd(), 'classification-test-report.json')
  writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed,
      failed,
      accuracy: parseFloat(accuracy),
      avgConfidence
    },
    results
  }, null, 2))
  
  console.log(`📄 詳細報告已保存: ${reportPath}`)
  console.log('')
  
  return {
    passed: failed === 0,
    accuracy: parseFloat(accuracy),
    results
  }
}

// Main
async function main() {
  const args = process.argv.slice(2)
  let testCases = DEFAULT_TEST_CASES
  
  // 從文件加載測試案例
  if (args.length > 0) {
    const filePath = join(process.cwd(), args[0])
    try {
      const fileContent = readFileSync(filePath, 'utf-8')
      testCases = JSON.parse(fileContent)
      console.log(`✅ 從 ${args[0]} 加載了 ${testCases.length} 個測試案例`)
      console.log('')
    } catch (error: any) {
      console.error(`❌ 無法加載測試文件: ${error.message}`)
      console.log('')
      console.log('使用預設測試案例...')
      console.log('')
    }
  }
  
  const { passed, accuracy } = await runTests(testCases)
  
  if (passed) {
    console.log('🎉 所有測試通過！')
    process.exit(0)
  } else {
    console.log('⚠️  部分測試失敗，準確度:', accuracy + '%')
    process.exit(accuracy >= 80 ? 0 : 1)
  }
}

main().catch(error => {
  console.error('❌ 測試運行失敗:', error)
  process.exit(1)
})

#!/usr/bin/env tsx

/**
 * Script to fix icon props in Server Components
 * Converts icon={IconName} to icon={<IconName className="h-4 w-4" />}
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

// Files to process (all TSX files in apps/web)
const PATTERN = 'apps/web/**/*.tsx'

// Icon names from lucide-react (common ones we use)
const ICON_NAMES = new Set([
  'Plus', 'Edit', 'Eye', 'Download', 'Upload', 'Search', 'Filter', 'X',
  'Briefcase', 'Users', 'User', 'FileText', 'File', 'FolderOpen',
  'TrendingUp', 'TrendingDown', 'Clock', 'Calendar', 'DollarSign',
  'CheckCircle2', 'AlertCircle', 'XCircle', 'Globe', 'Languages',
  'ChevronLeft', 'ChevronRight', 'Chevron Left', 'ChevronRight',
  'Building2', 'Archive', 'Loader2', 'Brain', 'Sparkles',
  'ArrowLeft', 'Save', 'SearchIcon'
])

async function main() {
  console.log('🔍 Finding TSX files...')
  
  const files = await glob(PATTERN, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
  })
  
  console.log(`📁 Found ${files.length} files`)
  
  let totalReplacements = 0
  let filesChanged = 0
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    let newContent = content
    let replacements = 0
    
    // Pattern 1: icon={IconName} (exact match)
    for (const iconName of ICON_NAMES) {
      const pattern = new RegExp(`icon=\\{${iconName}\\}`, 'g')
      const replacement = `icon={<${iconName} className="h-4 w-4" />}`
      
      const matches = (newContent.match(pattern) || []).length
      if (matches > 0) {
        newContent = newContent.replace(pattern, replacement)
        replacements += matches
      }
    }
    
    // Pattern 2: icon={loading ? Loader2 : IconName}
    // This is more complex, skip for now
    
    if (replacements > 0) {
      fs.writeFileSync(file, newContent, 'utf-8')
      console.log(`✅ ${file}: ${replacements} replacements`)
      filesChanged++
      totalReplacements += replacements
    }
  }
  
  console.log(`\n✨ Done!`)
  console.log(`📊 Changed ${filesChanged} files`)
  console.log(`🔄 Total replacements: ${totalReplacements}`)
}

main().catch(console.error)

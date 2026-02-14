/**
 * Bootstrap Initial Data for Looper-HQ
 * 
 * Creates:
 * - Default firm (law office)
 * - Admin user (email: admin@looper-hq.app, login via Credentials provider)
 * - Admin membership (PREMIER tier)
 * - Initial activity log
 * 
 * Usage:
 * pnpm bootstrap:data
 * 
 * Note: This script uses Credentials provider for development.
 * In production, users should authenticate via Keycloak OAuth.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting Looper-HQ Bootstrap...\n')

  // 1. Create default firm
  console.log('📊 Creating default firm...')
  const firm = await prisma.firm.upsert({
    where: { email: 'admin@looper-hq.app' },
    update: {},
    create: {
      name: 'Looper HQ Default Firm',
      email: 'admin@looper-hq.app',
      phone: '+852-0000-0000',
      address: 'Hong Kong',
      website: 'https://looper-hq.app',
      subscription: 'PROFESSIONAL',
    },
  })
  console.log(`✅ Firm created: ${firm.name} (${firm.id})\n`)

  // 2. Create admin user
  console.log('👤 Creating admin user...')
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@looper-hq.app' },
    update: {},
    create: {
      email: 'admin@looper-hq.app',
      name: 'System Administrator',
      role: 'ADMIN',
      firmId: firm.id,
      firmOwner: true,
    },
  })
  console.log(`✅ Admin user created: ${adminUser.email}`)
  console.log(`   Note: Use Credentials provider in login (any password works in dev)\n`)

  // 3. Create default membership for admin
  console.log('💳 Creating admin membership...')
  const membership = await prisma.membership.upsert({
    where: { 
      id: `${adminUser.id}-default-membership`,
    },
    update: {},
    create: {
      id: `${adminUser.id}-default-membership`,
      userId: adminUser.id,
      tier: 'PREMIER',
      isActive: true,
      searchLimit: 1000, // Higher limit for admin
      caseLimit: 1000,
    },
  })
  console.log(`✅ Membership created: ${membership.tier}\n`)

  // 4. Bootstrap AI Configuration
  console.log('🤖 Bootstrapping AI configuration...')
  
  const aiProvider = process.env.AI_PROVIDER || 'openai'
  const aiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const aiLocale = process.env.AI_DEFAULT_LOCALE || 'zh-HK'

  console.log(`   Provider: ${aiProvider}`)
  console.log(`   Model: ${aiModel}`)
  console.log(`   Locale: ${aiLocale}`)
  
  // Note: If you have an AiConfig model in Prisma schema, uncomment and adjust:
  /*
  const aiConfig = await prisma.aiConfig.upsert({
    where: { firmId: firm.id },
    update: {},
    create: {
      firmId: firm.id,
      provider: aiProvider,
      model: aiModel,
      defaultLanguage: aiLocale,
      systemPrompt: '你是專業的香港法律案例分析助手。請準確翻譯法律文件，保持專業術語的準確性。',
      features: ['case_classification', 'legal_translation', 'case_summarization'],
      config: {
        maxTokens: Number(process.env.AI_MAX_TOKENS || 2048),
        temperature: Number(process.env.AI_TEMPERATURE || 0.3),
      },
    },
  })
  console.log(`✅ AI Config created for firm: ${firm.name}\n`)
  */
  
  console.log(`✅ AI configuration recorded (using env vars)\n`)

  // 5. Create initial system activity log
  console.log('📝 Creating initial activity log...')
  await prisma.activity.create({
    data: {
      userId: adminUser.id,
      type: 'CASE_CREATED',
      action: 'SYSTEM_BOOTSTRAP',
      description: `Initial system bootstrap completed - AI: ${aiProvider}/${aiModel}`,
      metadata: {
        aiProvider,
        aiModel,
        aiLocale,
        timestamp: new Date().toISOString(),
      },
    },
  })
  console.log(`✅ Activity log created\n`)

  console.log('🎉 Bootstrap completed successfully!\n')
  console.log('📌 Default Credentials:')
  console.log('   Email: admin@looper-hq.app')
  console.log('   Password: Any password works in dev mode (Credentials provider)')
  console.log('   (In production, use Keycloak OAuth)\n')
}

main()
  .catch((error) => {
    console.error('❌ Bootstrap failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

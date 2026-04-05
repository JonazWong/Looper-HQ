import { PrismaClient, UserRole } from '../packages/database'

const prisma = new PrismaClient()

const DEFAULT_FIRM_EMAIL = 'admin@looperhq.hk'

const demoUsers: Array<{
  email: string
  name: string
  role: UserRole
  phone?: string
  firmOwner?: boolean
  assignFirm?: boolean
}> = [
  {
    email: 'admin@looperhq.hk',
    name: 'Administrator',
    role: 'ADMIN',
    phone: '+852 3000 0001',
    firmOwner: true,
    assignFirm: true,
  },
  {
    email: 'admin@looperhq.com',
    name: 'Admin User',
    role: 'ADMIN',
    phone: '+852 9123 4567',
    firmOwner: true,
    assignFirm: true,
  },
  {
    email: 'sarah.chen@looperhq.com',
    name: 'Sarah Chen',
    role: 'LAWYER',
    phone: '+852 9234 5678',
    firmOwner: false,
    assignFirm: true,
  },
  {
    email: 'wong.client@example.com',
    name: 'Mr. Wong',
    role: 'CLIENT',
    phone: '+852 9456 7890',
    firmOwner: false,
    assignFirm: false,
  },
]

async function ensureDefaultFirm() {
  return prisma.firm.upsert({
    where: { email: DEFAULT_FIRM_EMAIL },
    update: {
      name: 'Looper HQ',
      phone: '+852 3000 0000',
      address: 'Hong Kong',
      subscription: 'ENTERPRISE',
    },
    create: {
      name: 'Looper HQ',
      email: DEFAULT_FIRM_EMAIL,
      phone: '+852 3000 0000',
      address: 'Hong Kong',
      subscription: 'ENTERPRISE',
    },
  })
}

async function main() {
  console.log('Checking demo auth users...')

  const firm = await ensureDefaultFirm()

  let created = 0
  let updated = 0

  for (const user of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } })

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        phone: user.phone,
        firmId: user.assignFirm ? firm.id : null,
        firmOwner: user.firmOwner ?? false,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        firmId: user.assignFirm ? firm.id : null,
        firmOwner: user.firmOwner ?? false,
      },
    })

    if (existing) {
      updated += 1
    } else {
      created += 1
    }
  }

  console.log(`Demo users ensured. created=${created}, updated=${updated}`)
  console.log('Credentials (development credentials provider):')
  console.log('  - admin@looperhq.hk / any password')
  console.log('  - admin@looperhq.com / any password')
  console.log('  - sarah.chen@looperhq.com / any password')
  console.log('  - wong.client@example.com / any password')
}

main()
  .catch((error) => {
    console.error('Failed to ensure demo users:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

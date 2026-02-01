import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.activity.deleteMany();
  await prisma.caseNote.deleteMany();
  await prisma.timeLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.document.deleteMany();
  await prisma.case.deleteMany();
  await prisma.client.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.searchHistory.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  console.log('Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@looperhq.com',
      name: 'Admin User',
      role: 'ADMIN',
      phone: '+852 9123 4567',
    },
  });

  const lawyer1 = await prisma.user.create({
    data: {
      email: 'sarah.chen@looperhq.com',
      name: 'Sarah Chen',
      role: 'LAWYER',
      phone: '+852 9234 5678',
    },
  });

  const lawyer2 = await prisma.user.create({
    data: {
      email: 'michael.lee@looperhq.com',
      name: 'Michael Lee',
      role: 'LAWYER',
      phone: '+852 9345 6789',
    },
  });

  const client1 = await prisma.user.create({
    data: {
      email: 'wong.client@example.com',
      name: 'Mr. Wong',
      role: 'CLIENT',
      phone: '+852 9456 7890',
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: 'li.family@example.com',
      name: 'Li Family Trust',
      role: 'CLIENT',
      phone: '+852 9567 8901',
    },
  });

  const client3 = await prisma.user.create({
    data: {
      email: 'abc.ltd@example.com',
      name: 'ABC Limited',
      role: 'CLIENT',
      phone: '+852 9678 9012',
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@looperhq.com',
      name: 'Emily Wong',
      role: 'STAFF',
      phone: '+852 9789 0123',
    },
  });

  console.log(`✓ Created ${7} users`);

  // Create Memberships
  console.log('Creating memberships...');
  await prisma.membership.createMany({
    data: [
      {
        userId: client1.id,
        tier: 'BASIC',
        isActive: true,
        searchLimit: 10,
        caseLimit: 3,
      },
      {
        userId: client2.id,
        tier: 'PREMIUM',
        isActive: true,
        searchLimit: 50,
        caseLimit: 10,
      },
      {
        userId: client3.id,
        tier: 'PREMIER',
        isActive: true,
        searchLimit: -1, // unlimited
        caseLimit: null, // unlimited
      },
    ],
  });

  console.log('✓ Created memberships');

  // Create Clients
  console.log('Creating clients...');
  await prisma.client.createMany({
    data: [
      {
        userId: client1.id,
        type: 'INDIVIDUAL',
        fullName: 'Wong Tai Man',
        email: 'wong.client@example.com',
        phone: '+852 9456 7890',
        idNumber: 'A123456(7)',
        membershipTier: 'BASIC',
        address: '1/F, 123 Queen\'s Road Central, Hong Kong',
      },
      {
        userId: client2.id,
        type: 'INDIVIDUAL',
        fullName: 'Li Ka Shing',
        email: 'li.family@example.com',
        phone: '+852 9567 8901',
        idNumber: 'B234567(8)',
        membershipTier: 'PREMIUM',
        address: '2/F, 456 Nathan Road, Kowloon',
      },
      {
        userId: client3.id,
        type: 'COMPANY',
        fullName: 'John Chan',
        companyName: 'ABC Limited',
        email: 'abc.ltd@example.com',
        phone: '+852 9678 9012',
        businessReg: '12345678',
        membershipTier: 'PREMIER',
        address: '15/F, 789 Hennessy Road, Wan Chai',
      },
    ],
  });

  console.log('✓ Created clients');

  // Create Cases
  console.log('Creating cases...');
  const case1 = await prisma.case.create({
    data: {
      caseNumber: 'HK-2026-001',
      title: 'Wong v. Chan Property Dispute',
      description: 'Boundary dispute regarding property at 123 Queen\'s Road Central. Client claims encroachment by neighboring property.',
      status: 'ACTIVE',
      priority: 'HIGH',
      category: 'PROPERTY',
      clientId: client1.id,
      lawyerId: lawyer1.id,
      startDate: new Date('2024-01-15'),
      courtDate: new Date('2024-03-15'),
      estimatedValue: 2500000,
      isPublic: true,
      publicNote: 'Property boundary dispute case',
    },
  });

  const case2 = await prisma.case.create({
    data: {
      caseNumber: 'HK-2026-002',
      title: 'Li Family Trust Administration',
      description: 'Administration of the Li family trust estate. Multiple beneficiaries and complex asset distribution.',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      category: 'FAMILY',
      clientId: client2.id,
      lawyerId: lawyer1.id,
      startDate: new Date('2024-01-20'),
      estimatedValue: 15000000,
      isPublic: false,
    },
  });

  const case3 = await prisma.case.create({
    data: {
      caseNumber: 'HK-2026-003',
      title: 'Corporate Merger - ABC Ltd',
      description: 'Merger and acquisition advisory for ABC Limited. Due diligence and regulatory compliance required.',
      status: 'ACTIVE',
      priority: 'URGENT',
      category: 'CORPORATE',
      clientId: client3.id,
      lawyerId: lawyer2.id,
      startDate: new Date('2024-01-25'),
      estimatedValue: 50000000,
      isPublic: true,
      publicNote: 'Corporate merger case',
    },
  });

  const case4 = await prisma.case.create({
    data: {
      caseNumber: 'HK-2026-004',
      title: 'Employment Termination Dispute',
      description: 'Wrongful termination claim. Employee alleges unfair dismissal and seeks compensation.',
      status: 'COMPLETED',
      priority: 'LOW',
      category: 'EMPLOYMENT',
      clientId: client1.id,
      lawyerId: lawyer2.id,
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-28'),
      estimatedValue: 150000,
      isPublic: false,
    },
  });

  const case5 = await prisma.case.create({
    data: {
      caseNumber: 'HK-2026-005',
      title: 'Intellectual Property Infringement',
      description: 'Copyright infringement case involving software patents.',
      status: 'PENDING',
      priority: 'MEDIUM',
      category: 'INTELLECTUAL_PROPERTY',
      clientId: client3.id,
      lawyerId: lawyer1.id,
      startDate: new Date('2024-02-01'),
      estimatedValue: 800000,
      isPublic: true,
      publicNote: 'IP infringement case',
    },
  });

  console.log(`✓ Created ${5} cases`);

  // Create Activities
  console.log('Creating activities...');
  await prisma.activity.createMany({
    data: [
      {
        userId: lawyer1.id,
        caseId: case1.id,
        type: 'CASE_CREATED',
        action: 'filed',
        description: 'New case: Wong v. Chan Property Dispute',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        userId: lawyer2.id,
        caseId: case3.id,
        type: 'DOCUMENT_UPLOADED',
        action: 'updated',
        description: 'Case documents uploaded for HK-2026-003',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        userId: staff.id,
        caseId: case2.id,
        type: 'MEETING_SCHEDULED',
        action: 'scheduled',
        description: 'Court hearing for Li Family Trust',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        userId: lawyer2.id,
        caseId: case4.id,
        type: 'CASE_CLOSED',
        action: 'completed',
        description: 'Settlement reached in employment dispute',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        userId: admin.id,
        type: 'CLIENT_ADDED',
        action: 'created',
        description: 'New client profile: ABC Limited',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✓ Created activities');

  // Create Documents
  console.log('Creating documents...');
  await prisma.document.createMany({
    data: [
      {
        caseId: case1.id,
        uploadedById: lawyer1.id,
        fileName: 'property_deed.pdf',
        fileSize: 2048576,
        fileType: 'application/pdf',
        fileUrl: '/documents/property_deed.pdf',
        category: 'EVIDENCE',
        description: 'Original property deed showing boundaries',
        isConfidential: false,
      },
      {
        caseId: case1.id,
        uploadedById: lawyer1.id,
        fileName: 'survey_report.pdf',
        fileSize: 3145728,
        fileType: 'application/pdf',
        fileUrl: '/documents/survey_report.pdf',
        category: 'EVIDENCE',
        description: 'Professional land survey report',
        isConfidential: false,
      },
      {
        caseId: case2.id,
        uploadedById: lawyer1.id,
        fileName: 'trust_agreement.pdf',
        fileSize: 1572864,
        fileType: 'application/pdf',
        fileUrl: '/documents/trust_agreement.pdf',
        category: 'CONTRACT',
        description: 'Original trust agreement',
        isConfidential: true,
      },
      {
        caseId: case3.id,
        uploadedById: lawyer2.id,
        fileName: 'merger_proposal.pdf',
        fileSize: 5242880,
        fileType: 'application/pdf',
        fileUrl: '/documents/merger_proposal.pdf',
        category: 'CONTRACT',
        description: 'Detailed merger proposal and terms',
        isConfidential: true,
      },
    ],
  });

  console.log('✓ Created documents');

  // Create Case Notes
  console.log('Creating case notes...');
  await prisma.caseNote.createMany({
    data: [
      {
        caseId: case1.id,
        content: 'Initial consultation with client. Client provided detailed history of the dispute. Neighboring property owner has been uncooperative.',
        isPrivate: false,
      },
      {
        caseId: case1.id,
        content: 'Confidential: Client willing to settle for HKD 2.5M but prefers to avoid court if possible.',
        isPrivate: true,
      },
      {
        caseId: case2.id,
        content: 'Family meeting scheduled. All beneficiaries must be present to discuss asset distribution.',
        isPrivate: false,
      },
      {
        caseId: case3.id,
        content: 'Due diligence report received. Several regulatory compliance issues need to be addressed before proceeding.',
        isPrivate: true,
      },
    ],
  });

  console.log('✓ Created case notes');

  // Create Time Logs
  console.log('Creating time logs...');
  await prisma.timeLog.createMany({
    data: [
      {
        caseId: case1.id,
        description: 'Initial client consultation and case review',
        hours: 2.5,
        hourlyRate: 3000,
        billable: true,
        logDate: new Date('2024-01-16'),
      },
      {
        caseId: case1.id,
        description: 'Legal research on property boundary disputes',
        hours: 4.0,
        hourlyRate: 3000,
        billable: true,
        logDate: new Date('2024-01-17'),
      },
      {
        caseId: case2.id,
        description: 'Trust document review and analysis',
        hours: 5.5,
        hourlyRate: 3500,
        billable: true,
        logDate: new Date('2024-01-21'),
      },
      {
        caseId: case3.id,
        description: 'Corporate due diligence review',
        hours: 8.0,
        hourlyRate: 4000,
        billable: true,
        logDate: new Date('2024-01-26'),
      },
    ],
  });

  console.log('✓ Created time logs');

  // Create Invoices
  console.log('Creating invoices...');
  await prisma.invoice.createMany({
    data: [
      {
        invoiceNumber: 'INV-2024-001',
        caseId: case1.id,
        amount: 19500,
        currency: 'HKD',
        status: 'PAID',
        issueDate: new Date('2024-01-18'),
        dueDate: new Date('2024-02-17'),
        paidDate: new Date('2024-01-25'),
      },
      {
        invoiceNumber: 'INV-2024-002',
        caseId: case2.id,
        amount: 19250,
        currency: 'HKD',
        status: 'PENDING',
        issueDate: new Date('2024-01-25'),
        dueDate: new Date('2024-02-24'),
      },
      {
        invoiceNumber: 'INV-2024-003',
        caseId: case3.id,
        amount: 32000,
        currency: 'HKD',
        status: 'PENDING',
        issueDate: new Date('2024-01-30'),
        dueDate: new Date('2024-02-28'),
      },
    ],
  });

  console.log('✓ Created invoices');

  // Create Search History
  console.log('Creating search history...');
  await prisma.searchHistory.createMany({
    data: [
      {
        ipAddress: '192.168.1.100',
        query: 'property dispute',
        resultsCount: 3,
        searchedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        ipAddress: '192.168.1.100',
        query: 'corporate merger',
        resultsCount: 2,
        searchedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        ipAddress: '192.168.1.101',
        query: 'employment dispute',
        resultsCount: 1,
        searchedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✓ Created search history');

  console.log('\n✅ Database seeded successfully!');
  console.log('\nSummary:');
  console.log(`- Users: 7 (1 admin, 2 lawyers, 3 clients, 1 staff)`);
  console.log(`- Cases: 5 (3 active, 1 completed, 1 pending)`);
  console.log(`- Clients: 3`);
  console.log(`- Memberships: 3`);
  console.log(`- Documents: 4`);
  console.log(`- Activities: 5`);
  console.log(`- Case Notes: 4`);
  console.log(`- Time Logs: 4`);
  console.log(`- Invoices: 3`);
  console.log(`- Search History: 3`);
}

main()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

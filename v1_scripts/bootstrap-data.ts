import { prisma } from "@looper-hq/database"; // 依實際 export 調整

async function ensureFirm() {
  // TODO: 將 "Firm" / "Tenant" 模型名稱改成實際 Prisma model
  const code = "default-firm";
  let firm = await prisma.firm.findUnique({ where: { code } }).catch(() => null as any);

  if (!firm) {
    firm = await prisma.firm.create({
      data: {
        code,
        name: "Default Law Firm",
        locale: "zh-HK",
      },
    });
    console.log("✓ 建立預設事務所 / 租戶");
  } else {
    console.log("• 預設事務所已存在，略過建立");
  }
  return firm;
}

async function ensureAdminUser(firmId: string) {
  // TODO: 把 User / email 欄位名稱改成你實際的 schema
  const email = "admin@local.looper";
  let user = await prisma.user.findUnique({ where: { email } }).catch(() => null as any);

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: "System Admin",
        // TODO: 使用實際的密碼 hash 流程；目前僅示意
        passwordHash: "CHANGE_ME",
        firmId,
        role: "ADMIN", // 如果是關聯表結構，請改為關聯方式
      },
    });
    console.log("✓ 建立預設管理員帳號（請登入後立即修改密碼）");
  } else {
    console.log("• 預設管理員帳號已存在，略過建立");
  }
}

async function ensureAiSettings(firmId: string) {
  // 依你實際 model：例如 AiSettings / AiProfile / AgentConfig 等
  // 下面是一個假設性的例子：
  const key = "default-ai-config";
  // @ts-ignore 示意用
  let aiConfig = await prisma.aiSettings.findUnique({ where: { key_firmId: { key, firmId } } }).catch(() => null as any);

  if (!aiConfig) {
    // @ts-ignore 示意用
    aiConfig = await prisma.aiSettings.create({
      data: {
        key,
        firmId,
        provider: "openai",
        model: "gpt-4.1-mini",
        defaultLanguage: "zh-HK",
        maxTokens: 2048,
        temperature: 0.3,
        systemPrompt: [
          "你是一個專注於香港法律案件的 AI 法律助理。",
          "請以繁體中文回覆，用專業但易懂的方式解釋法律概念。",
          "當引用案例或法例時，盡量附上案件編號或法例章節。",
          "如果不確定或資料不足，請清楚說明不確定的部分，而不是亂猜。"
        ].join("\n"),
        enabledFeatures: ["case_summarization", "search_explanation", "timeline_generation"],
      },
    });
    console.log("✓ 建立預設 AI 設定（provider / model / system prompt）");
  } else {
    console.log("• 預設 AI 設定已存在，略過建立");
  }
}

async function main() {
  console.log("===== 開始執行 bootstrap-data（初始資料與 AI 設定）=====");

  const firm = await ensureFirm();
  await ensureAdminUser(firm.id);
  await ensureAiSettings(firm.id);

  console.log("===== bootstrap-data 完成 =====");
}

main()
  .catch((err) => {
    console.error("bootstrap-data 失敗", err);
    process.exit(1);
  })
  .finally(async () => {
    // 若 prisma client 需要顯式關閉連線
    // @ts-ignore
    if (prisma.$disconnect) {
      // @ts-ignore
      await prisma.$disconnect();
    }
  });
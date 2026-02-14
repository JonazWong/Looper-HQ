import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../services/api/src/entities/User";
import { Role } from "../services/api/src/entities/Role";
import { Page } from "../services/api/src/entities/Page";
import { Menu } from "../services/api/src/entities/Menu";

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [User, Role, Page, Menu],
});

async function bootstrap() {
  await AppDataSource.initialize();

  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);
  const pageRepo = AppDataSource.getRepository(Page);
  const menuRepo = AppDataSource.getRepository(Menu);

  // 1. 角色
  let adminRole = await roleRepo.findOne({ where: { name: "admin" } });
  if (!adminRole) {
    adminRole = roleRepo.create({ name: "admin", description: "系統管理員" });
    await roleRepo.save(adminRole);
  }

  // 2. 管理員帳號
  let adminUser = await userRepo.findOne({ where: { email: "admin@looper.local" } });
  if (!adminUser) {
    adminUser = userRepo.create({
      email: "admin@looper.local",
      // TODO: 替換為你的 hash 密碼邏輯
      passwordHash: "CHANGE_ME",
      roles: [adminRole],
    });
    await userRepo.save(adminUser);
  }

  // 3. 頁面
  const pagesToEnsure = [
    { code: "dashboard", name: "總覽儀表板" },
    { code: "crawler", name: "搜尋爬蟲管理" },
    { code: "db_admin", name: "資料庫管理" },
  ];

  for (const p of pagesToEnsure) {
    let page = await pageRepo.findOne({ where: { code: p.code } });
    if (!page) {
      page = pageRepo.create(p);
      await pageRepo.save(page);
    }
  }

  // 4. 菜單與關聯（視你的 schema 而定，這裡略）

  await AppDataSource.destroy();
  console.log("Bootstrap 完成：預設角色、使用者、頁面已建立（若原本不存在）。");
}

bootstrap().catch((err) => {
  console.error("Bootstrap 失敗", err);
  process.exit(1);
});
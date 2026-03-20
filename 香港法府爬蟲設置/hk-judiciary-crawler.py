#!/usr/bin/env python3
"""
香港司法機構審訊案件表爬蟲程式
Hong Kong Judiciary Daily Cause List Crawler

此爬蟲程式可自動下載香港各級法院的審訊案件表，支援定時排程和多法院爬取
"""

import os
import sys
import json
import logging
import requests
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import time
import hashlib

# ==================== 日誌配置 ====================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('crawler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class JudiciaryDatabase:
    """香港司法機構資料庫管理"""
    
    def __init__(self, db_path: str = 'judiciary_cases.db'):
        """初始化資料庫連接"""
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        """初始化資料庫結構"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 創建案件表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_number TEXT UNIQUE NOT NULL,
                case_hash TEXT UNIQUE NOT NULL,
                court TEXT NOT NULL,
                hearing_date TEXT NOT NULL,
                hearing_time TEXT,
                room TEXT,
                judge TEXT,
                parties TEXT,
                nature TEXT,
                solicitors TEXT,
                status TEXT DEFAULT 'active',
                crawled_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source_url TEXT
            )
        ''')
        
        # 創建爬蟲執行記錄表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS crawler_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                crawl_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                court TEXT NOT NULL,
                status TEXT,
                cases_count INTEGER,
                error_message TEXT,
                duration_seconds FLOAT
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def insert_or_update_case(self, case_data: Dict) -> bool:
        """插入或更新案件記錄"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 生成案件雜湊值用於檢測重複
            case_hash = hashlib.md5(
                f"{case_data['case_number']}{case_data['hearing_date']}".encode()
            ).hexdigest()
            
            # 檢查是否已存在
            cursor.execute(
                'SELECT id FROM cases WHERE case_hash = ?',
                (case_hash,)
            )
            existing = cursor.fetchone()
            
            if existing:
                # 更新現有記錄
                cursor.execute('''
                    UPDATE cases SET
                        judge = ?, parties = ?, nature = ?, 
                        solicitors = ?, updated_date = CURRENT_TIMESTAMP
                    WHERE case_hash = ?
                ''', (
                    case_data.get('judge', ''),
                    case_data.get('parties', ''),
                    case_data.get('nature', ''),
                    case_data.get('solicitors', ''),
                    case_hash
                ))
            else:
                # 插入新記錄
                cursor.execute('''
                    INSERT INTO cases (
                        case_number, case_hash, court, hearing_date, 
                        hearing_time, room, judge, parties, nature, 
                        solicitors, source_url
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    case_data['case_number'],
                    case_hash,
                    case_data['court'],
                    case_data['hearing_date'],
                    case_data.get('hearing_time', ''),
                    case_data.get('room', ''),
                    case_data.get('judge', ''),
                    case_data.get('parties', ''),
                    case_data.get('nature', ''),
                    case_data.get('solicitors', ''),
                    case_data.get('source_url', '')
                ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"資料庫插入失敗: {e}")
            return False
    
    def log_crawl(self, court: str, status: str, cases_count: int, 
                  error_msg: str = '', duration: float = 0):
        """記錄爬蟲執行日誌"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO crawler_logs (court, status, cases_count, error_message, duration_seconds)
                VALUES (?, ?, ?, ?, ?)
            ''', (court, status, cases_count, error_msg, duration))
            
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"記錄爬蟲日誌失敗: {e}")


class JudiciaryWebScraper:
    """香港司法機構網頁爬蟲"""
    
    # 法院代碼對應表
    COURT_CODES = {
        'DC': '區域法院',
        'DCMC': '區域法院(聆案官聆訊案件表)',
        'HCA': '高等法院(上訴法庭)',
        'HCCFI': '高等法院(原訟法庭)',
        'HCMC': '高等法院(聆案官聆訊案件表)',
        'MC': '裁判法院',
        'EDD': '東區裁判法院',
        'KCC': '九龍城裁判法院',
        'KTN': '觀塘裁判法院',
        'WKL': '西九龍裁判法院',
        'ST': '沙田裁判法院',
        'FL': '粉嶺裁判法院',
        'TM': '屯門裁判法院',
        'FHC': '家事法庭',
        'LT': '土地審裁處',
        'LEC': '勞資審裁處',
        'SDCC': '小額錢債審裁處'
    }
    
    BASE_URL = 'https://e-services.judiciary.hk/dcl/index.jsp'
    
    def __init__(self, db: JudiciaryDatabase):
        """初始化爬蟲"""
        self.db = db
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.timeout = 15
        self.max_retries = 3
    
    def get_latest_date(self) -> Optional[str]:
        """取得最新的案件表日期"""
        try:
            params = {
                'lang': 'tc',
                'mode': 'view',
                'date': 'latest',
                'court': 'DC'
            }
            
            response = self.session.get(self.BASE_URL, params=params, timeout=self.timeout)
            response.encoding = 'utf-8'
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 尋找日期輸入框
                date_input = soup.find('input', {'id': 'dclDate'})
                if date_input and date_input.get('value'):
                    return date_input.get('value')
            
            return None
        except Exception as e:
            logger.error(f"取得日期失敗: {e}")
            return None
    
    def fetch_court_list(self, court_code: str, date: str = 'latest') -> Optional[str]:
        """取得特定法院的審訊案件表 HTML"""
        params = {
            'lang': 'tc',
            'mode': 'view',
            'date': date,
            'court': court_code
        }
        
        for attempt in range(self.max_retries):
            try:
                response = self.session.get(
                    self.BASE_URL, 
                    params=params, 
                    timeout=self.timeout
                )
                response.encoding = 'utf-8'
                
                if response.status_code == 200:
                    logger.info(f"成功取得 {self.COURT_CODES.get(court_code, court_code)} 的案件表")
                    return response.text
                else:
                    logger.warning(f"HTTP {response.status_code}: {court_code}")
                    
            except requests.RequestException as e:
                logger.warning(f"第 {attempt + 1} 次嘗試失敗 ({court_code}): {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)  # 指數退避
        
        logger.error(f"無法取得 {self.COURT_CODES.get(court_code, court_code)} 的案件表")
        return None
    
    def parse_case_table(self, html: str, court_code: str, date: str) -> List[Dict]:
        """解析案件表 HTML 並提取案件資訊"""
        cases = []
        
        try:
            soup = BeautifulSoup(html, 'html.parser')
            court_name = self.COURT_CODES.get(court_code, court_code)
            
            # 尋找表格容器 - 司法機構網站使用 divs 而非 tables
            # 根據網站結構進行適應性解析
            
            # 方法 1: 尋找特定 class 的 div
            case_containers = soup.find_all('div', class_=['case-row', 'case-item', 'list-item'])
            
            if not case_containers:
                # 方法 2: 尋找所有表格（某些法院可能使用表格）
                tables = soup.find_all('table')
                for table in tables:
                    rows = table.find_all('tr')
                    for row in rows[1:]:  # 跳過標題行
                        cells = row.find_all('td')
                        if len(cells) >= 3:
                            case = self._extract_case_from_cells(
                                cells, court_code, court_name, date
                            )
                            if case:
                                cases.append(case)
            
            else:
                # 解析 div 容器中的案件
                for container in case_containers:
                    case = self._extract_case_from_container(
                        container, court_code, court_name, date
                    )
                    if case:
                        cases.append(case)
            
            logger.info(f"解析 {court_name} 找到 {len(cases)} 個案件 (日期: {date})")
            return cases
            
        except Exception as e:
            logger.error(f"解析案件表失敗 ({court_code}): {e}")
            return []
    
    def _extract_case_from_cells(self, cells: list, court_code: str, 
                                 court_name: str, date: str) -> Optional[Dict]:
        """從表格單元格提取案件資訊"""
        try:
            case_data = {
                'court': court_name,
                'hearing_date': date,
                'source_url': f"{self.BASE_URL}?lang=tc&mode=view&date={date}&court={court_code}"
            }
            
            # 基於標準表格結構提取資料
            if len(cells) >= 3:
                case_data['case_number'] = cells[0].get_text(strip=True)
                case_data['parties'] = cells[1].get_text(strip=True)
                case_data['hearing_time'] = cells[2].get_text(strip=True) if len(cells) > 2 else ''
            
            # 驗證案件編號
            if case_data.get('case_number'):
                return case_data
            
            return None
        except Exception as e:
            logger.debug(f"提取案件資訊失敗: {e}")
            return None
    
    def _extract_case_from_container(self, container: object, court_code: str,
                                     court_name: str, date: str) -> Optional[Dict]:
        """從 div 容器提取案件資訊"""
        try:
            text = container.get_text(strip=True)
            if not text:
                return None
            
            return {
                'case_number': text[:50],  # 前 50 字作為案件編號
                'court': court_name,
                'hearing_date': date,
                'parties': text[50:150] if len(text) > 50 else '',
                'source_url': f"{self.BASE_URL}?lang=tc&mode=view&date={date}&court={court_code}"
            }
        except Exception as e:
            logger.debug(f"提取容器內容失敗: {e}")
            return None
    
    def crawl_all_courts(self, date: str = 'latest') -> Dict[str, int]:
        """爬取所有法院的案件表"""
        results = {}
        
        logger.info(f"開始爬取所有法院審訊案件表 (日期: {date})")
        
        for court_code, court_name in self.COURT_CODES.items():
            start_time = time.time()
            
            try:
                html = self.fetch_court_list(court_code, date)
                
                if html:
                    cases = self.parse_case_table(html, court_code, date)
                    
                    # 儲存案件到資料庫
                    saved_count = 0
                    for case in cases:
                        if self.db.insert_or_update_case(case):
                            saved_count += 1
                    
                    duration = time.time() - start_time
                    self.db.log_crawl(court_name, 'success', saved_count, '', duration)
                    results[court_code] = saved_count
                    logger.info(f"{court_name}: 儲存 {saved_count} 個案件")
                else:
                    duration = time.time() - start_time
                    self.db.log_crawl(court_name, 'failed', 0, 'HTML 取得失敗', duration)
                    results[court_code] = 0
                
            except Exception as e:
                duration = time.time() - start_time
                error_msg = str(e)
                self.db.log_crawl(court_name, 'error', 0, error_msg, duration)
                logger.error(f"{court_name} 爬取失敗: {e}")
                results[court_code] = 0
            
            # 禮貌的延遲，避免過度請求
            time.sleep(1)
        
        return results


class CrawlerScheduler:
    """爬蟲排程器"""
    
    def __init__(self, crawler: JudiciaryWebScraper):
        """初始化排程器"""
        self.crawler = crawler
    
    def run_daily(self, hour: int = 2, minute: int = 0):
        """每日執行爬蟲"""
        try:
            import schedule
            
            def job():
                logger.info(f"執行每日爬蟲任務: {datetime.now()}")
                results = self.crawler.crawl_all_courts()
                
                total_cases = sum(results.values())
                logger.info(f"每日爬蟲完成: 共爬取 {total_cases} 個案件")
            
            schedule.every().day.at(f"{hour:02d}:{minute:02d}").do(job)
            
            logger.info(f"爬蟲排程已設置: 每日 {hour:02d}:{minute:02d}")
            
            # 持續執行排程
            while True:
                schedule.run_pending()
                time.sleep(60)
        
        except ImportError:
            logger.error("需要安裝 schedule 套件: pip install schedule")
    
    def run_once(self):
        """執行一次爬蟲"""
        logger.info(f"執行單次爬蟲: {datetime.now()}")
        results = self.crawler.crawl_all_courts()
        
        total_cases = sum(results.values())
        logger.info(f"爬蟲完成: 共爬取 {total_cases} 個案件")
        
        # 輸出結果
        print("\n=== 爬蟲結果摘要 ===")
        for court_code, count in results.items():
            court_name = JudiciaryWebScraper.COURT_CODES.get(court_code, court_code)
            print(f"{court_name}: {count} 個案件")
        print(f"總計: {total_cases} 個案件")


def main():
    """主程式"""
    import argparse
    
    parser = argparse.ArgumentParser(description='香港司法機構審訊案件表爬蟲')
    parser.add_argument(
        '--mode',
        choices=['once', 'daily'],
        default='once',
        help='執行模式: 單次或每日 (預設: once)'
    )
    parser.add_argument(
        '--hour',
        type=int,
        default=2,
        help='每日執行時間 (小時，0-23，預設: 2)'
    )
    parser.add_argument(
        '--minute',
        type=int,
        default=0,
        help='每日執行時間 (分鐘，0-59，預設: 0)'
    )
    parser.add_argument(
        '--db',
        default='judiciary_cases.db',
        help='資料庫檔案路徑 (預設: judiciary_cases.db)'
    )
    
    args = parser.parse_args()
    
    # 初始化資料庫和爬蟲
    db = JudiciaryDatabase(args.db)
    scraper = JudiciaryWebScraper(db)
    scheduler = CrawlerScheduler(scraper)
    
    # 根據模式執行
    if args.mode == 'daily':
        logger.info(f"每日排程模式: {args.hour:02d}:{args.minute:02d}")
        scheduler.run_daily(args.hour, args.minute)
    else:
        logger.info("單次執行模式")
        scheduler.run_once()


if __name__ == '__main__':
    main()

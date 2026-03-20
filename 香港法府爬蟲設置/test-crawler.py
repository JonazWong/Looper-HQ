#!/usr/bin/env python3
"""
快速測試爬蟲連接和解析功能
用於驗證爬蟲是否正常運作
"""

import requests
from bs4 import BeautifulSoup
import sys

def test_connection():
    """測試網路連接"""
    print("🔍 測試網路連接...")
    try:
        response = requests.get(
            'https://www.judiciary.hk/zh/courts/dc_dailylist.html',
            timeout=10,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        if response.status_code == 200:
            print("✅ 網路連接成功")
            return True
        else:
            print(f"❌ HTTP 錯誤: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 連接失敗: {e}")
        return False

def test_api_endpoint():
    """測試司法機構 API 端點"""
    print("\n🔍 測試 API 端點...")
    try:
        response = requests.get(
            'https://e-services.judiciary.hk/dcl/index.jsp',
            params={
                'lang': 'tc',
                'mode': 'view',
                'date': 'latest',
                'court': 'DC'
            },
            timeout=10,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        if response.status_code == 200:
            print(f"✅ API 端點正常 (狀態碼: {response.status_code})")
            print(f"   回應大小: {len(response.content)} 字節")
            return response.text
        else:
            print(f"❌ API 錯誤: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ API 連接失敗: {e}")
        return None

def test_html_parsing(html):
    """測試 HTML 解析"""
    print("\n🔍 測試 HTML 解析...")
    try:
        soup = BeautifulSoup(html, 'html.parser')
        
        # 檢查關鍵元素
        date_input = soup.find('input', {'id': 'dclDate'})
        court_select = soup.find('select', {'name': 'court'})
        
        if date_input:
            date_value = date_input.get('value')
            print(f"✅ 找到日期輸入框: {date_value}")
        else:
            print("⚠️  未找到日期輸入框")
        
        if court_select:
            options = court_select.find_all('option')
            print(f"✅ 找到法院選擇框: {len(options)} 個法院選項")
        else:
            print("⚠️  未找到法院選擇框")
        
        # 檢查表格
        tables = soup.find_all('table')
        print(f"✅ 找到 {len(tables)} 個表格")
        
        return True
    except Exception as e:
        print(f"❌ HTML 解析失敗: {e}")
        return False

def main():
    """主測試流程"""
    print("=" * 50)
    print("香港司法機構爬蟲連接測試")
    print("=" * 50 + "\n")
    
    # 執行測試
    if not test_connection():
        print("\n❌ 無法連接到司法機構網站")
        sys.exit(1)
    
    html = test_api_endpoint()
    if not html:
        print("\n❌ 無法取得 API 回應")
        sys.exit(1)
    
    if not test_html_parsing(html):
        print("\n❌ HTML 解析失敗")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✅ 所有測試通過！爬蟲應已準備就緒")
    print("=" * 50)

if __name__ == '__main__':
    main()

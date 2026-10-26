# 《家族天下》｜原始聊天保存說明

> 目的：保存歷史證據，不讓原始聊天直接變成另一套規則來源。

## 建議分層

### GitHub 專案 Repo
只放：
- `CURRENT_RULES_INDEX.md`
- 最新 `V04_PROJECT_STATE_YYYY-MM-DD.md`
- 規則／工程狀態文件
- 已去除私人資料的必要交接紀錄

### 私人保存
可保存：
- ChatGPT 全帳號資料匯出
- 原始 `conversations.json`
- 單一聊天完整備份
- 截圖、草稿、已淘汰方案

如果 `family-empire` 是 Public，不要把整個 ChatGPT 匯出的 `conversations.json` 放進去。

## 版本更新

建立新快照時：
- 新檔：`docs/V04_PROJECT_STATE_YYYY-MM-DD.md`
- 舊檔移到：`docs/archive/`
- `docs/CURRENT_RULES_INDEX.md` 永遠只指向最新一份

原始聊天的用途：
- 查「當時到底怎麼說」
- 找遺漏決策
- 處理版本爭議

但日常設計與程式開發不要直接把整包聊天當規則資料庫。

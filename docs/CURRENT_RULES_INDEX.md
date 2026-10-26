# 《家族天下》V04｜CURRENT_RULES_INDEX

> 用途：指出現行規則的權威來源、最新快照、已知版本衝突與工程實作狀態。
>
> **本檔是索引，不是另一份規則書。**
>
> 最後更新：2026-10-26

## 1. 規則權威順序

由高到低：

1. V04 正式完整交接文件。
2. 該交接文件之後，由使用者在現役 Main 明確確認的正式決策。
3. `docs/V04_PROJECT_STATE_2026-10-26.md`：跨聊天搬遷用現況快照；若與第 1、2 項衝突，以第 1、2 項為準。
4. `docs/IMPLEMENTATION_STATUS.md`：只記錄桌遊規則與 Prototype / Headless Engine 的同步狀況，不得反向決定規則。
5. 瀏覽器 Prototype、Headless Engine、AI Simulation：都是實作／測試工具，程式中存在某條規則不代表該規則已定案。
6. 更舊的 V03、V1、早期 V04、舊 Prototype 文件：僅供歷史追溯，不得覆蓋後續 V04 決議。

## 2. 現役 Main

目前現役主線應視為：

**🟢 Main｜家族天下｜V04｜主線開發（現行聊天）**

舊的同名聊天已達對話長度上限，應視為：

**🔵 Archive｜家族天下｜V04｜主線開發｜01**

舊 Main 可查歷史，但不再新增決策。

## 3. 已確認的搬家修正

### 3.1 能力名稱

玩家規則正式使用：

- 武略
- 治理
- 王心
- 交際
- 名望

**「統率」不是現行玩家規則名稱。**

程式內部若仍使用 `command` 等欄位名稱，可作技術命名保留；但 UI、規則書、人物卡、PDF、測試報告顯示文字應使用「武略」。

## 4. 已知版本衝突

### 4.1 《王座上的少年》三個前置節點

目前找到兩個互相衝突的版本：

版本 A：
- 《宮門前的沉默》
- 《燈火直到深夜》
- 《來自松原的信》
- 三張洗混後暗中移除 1 張，本局只出現其中 2 張

版本 B：
- 上述三張全部出現
- 然後進入《少年密林王的怒火》

目前無法從現有保存資料證明哪一個是最後正式決策。

正式狀態：

> **【待核對｜版本衝突】不得由 AI、Prototype 或 Headless Engine 自行選一版。**

在使用者重新確認以前：
- 規則文件不得把其中一版標成【已定】
- AI Simulation 不得把其中一版偷偷寫成預設值
- 若模擬需要此流程，應標記 `UNKNOWN_RULE`

## 5. 現行規則／設計快照

目前整合快照：

- `docs/V04_PROJECT_STATE_2026-10-26.md`

該檔保存：
- 現行設計原則
- T2 測試環境
- 回合與主要行動
- 人物、能力、生命週期
- 四項家族傳奇
- 資源
- 地理、根基、產業
- 官職／資歷
- 婚姻／盟約
- 軍事／王軍
- 世界事件
- 爵位
- 《王座上的少年》
- 手牌
- 七大家族 Setup
- 美術方向
- AI／Headless Engine 工程狀態
- 【TEST】與【待確認】
- 已撤回／禁止復活的舊設計

## 6. GitHub 工程文件的角色

### `docs/AI_WORKFLOW.md`
記錄：
- AI 工作室四職能
- 規則來源管理
- 自動測試原則
- 未定規則不得補值

### `docs/IMPLEMENTATION_STATUS.md`
記錄：
- 現行桌遊規則 vs 瀏覽器 Prototype
- 現行桌遊規則 vs Headless Engine
- 已同步／未同步／coverage gap

### `sim/`
用途：
- deterministic RNG
- structural tests
- headless self-play
- invariant checks
- AI policies

**`sim/` 永遠不是規則權威來源。**

## 7. 之後每次正式決策的更新方式

每次在現役 Main 產生正式決策後：

1. 先在聊天中明確標示【已定】【TEST】【待確認】【撤回】。
2. 若影響完整規則，更新最新 `docs/V04_PROJECT_STATE_YYYY-MM-DD.md`；建立新快照時將舊快照移到 `docs/archive/`。
3. 若影響版本來源／衝突，更新 `docs/CURRENT_RULES_INDEX.md`。
4. 若影響程式，先更新 `docs/IMPLEMENTATION_STATUS.md`，再決定是否同步 Prototype / Headless Engine。
5. AI 測試結果只能提供設計判斷，不得自動修改正式規則或把 TEST 升格為已定。

## 8. 原始聊天保存原則

原始 ChatGPT 對話是歷史證據／決策追溯資料，不是日常規則書。

建議：
- GitHub 只保存整理過、去除私人資料的專案快照與決策紀錄。
- 原始完整聊天匯出另行保存在私人本機／私人雲端／私人 repo。
- 若 `family-empire` 是 Public，**不要上傳整個 ChatGPT 帳號的 `conversations.json`**。

## 9. 新聊天接手最低讀取順序

任何新 AI／新聊天接手時，先讀：

1. `docs/CURRENT_RULES_INDEX.md`
2. 當時最新的 `docs/V04_PROJECT_STATE_YYYY-MM-DD.md`
3. `docs/AI_WORKFLOW.md`
4. `docs/IMPLEMENTATION_STATUS.md`

然後：
- 不重新規劃
- 不用舊 Prototype 反駁新規則
- 遇到版本衝突先停下來標記
- 不自行猜答案

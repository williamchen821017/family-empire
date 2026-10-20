# V04 Simulation / AI Testing

這個資料夾不是第二份遊戲規則。它是一套**可重播、可稽核、會拒絕猜規則**的測試系統。

## 已完成：Headless Test Engine MVP

核心資料流已建立：

```
state
  ↓
legalActions(state)
  ↓
AI policy 只從合法選項挑選
  ↓
applyAction(state, action)
  ↓
invariantCheck(state)
  ↓
round / ◆ settlement
```

主要檔案：

- `headless/state.mjs`：Setup、遊戲狀態、事件牌序。
- `headless/legal-actions.mjs`：唯一合法行動入口。
- `headless/apply-action.mjs`：action reducer；非法 action 直接拒絕。
- `headless/invariants.mjs`：每一步後檢查不可能狀態。
- `headless/settlement.mjs`：回合、◆、生產、重要出生、資歷、老化、死亡、爵位父系繼承。
- `headless/legends.mjs`：四項家族傳奇檢查。
- `headless/engine.mjs`：Seed deterministic 自走對局。
- `policies.mjs`：random / expansion / conservative / political。
- `run-selfplay.mjs`：2–5人批量 AI self-play。

## 現在真正自動化的範圍

MVP 已執行：
- 2–5人 Setup 與七家測試快照。
- 每家每回合3次主要行動、輪流行動。
- 每人物需人物行動×2、正常移動×1。
- 籌措錢幣【TEST once/round】。
- 買糧。
- 取得產業與容量／供應檢查。
- 組建家兵、調動家兵、超額家兵維持。
- 入仕與資歷2→3的薦舉／名望判定骨架。
- 玩家—玩家婚姻提案、接受／拒絕；拒婚只封鎖該人物配對。
- ◆生產、每家每◆最多一次重要出生。
- 成年成長、資歷成長、老化、老年死亡。
- 男系爵位繼承的基本規則。
- 四項家族傳奇。
- Seed 重播、逐步 invariant check。

## 明確尚未覆蓋

目前 self-play 報告會列出 `coverageGaps`，包括：

- 一般事件的個別卡面效果（目前只使用◆時間節奏）。
- 8種手牌。
- NPC 名門婚姻完整名單與提親流程。
- 盟約。
- 開放官職的完整競逐。
- 王軍總量／王軍授權。
- 《王座上的少年》完整危機、清算、保全與新局安排。
- 事件封爵與爵位資格的完整應用。
- 寡婦再婚等尚未鎖定細節。

因此目前 core self-play **不是正式勝率證據**；輸出固定標記：

```json
"balanceEligible": false
```

它目前的用途是：
1. 抓死局與程式／規則矛盾。
2. 確認永久行動與歲月循環能長期運行。
3. 監測機制使用率與資源異常。
4. 為之後逐步補齊完整 V04 提供可回歸的基線。

## 執行方式

### 單元測試

```bash
node sim/test.mjs
node sim/test-headless.mjs
```

### Prototype 差異稽核

```bash
node sim/audit-prototype.mjs
node sim/audit-prototype.mjs --json
```

### 結構型 Monte Carlo

```bash
node sim/run-structural.mjs --seed demo-001 --iterations 50000
```

### AI self-play

```bash
node sim/run-selfplay.mjs --seed demo-001 --games 1000 --players 2,3,4,5
```

CI 要求發現 invariant 違規就失敗：

```bash
node sim/run-selfplay.mjs --seed ci --games 500 --players 2,3,4,5 --fail-on-violation
```

### Strict V04 模式

Headless test 另會驗證 strict 模式：碰到尚未實作、但正式終局必須依賴的《王座上的少年》危機時，測試必須以 `UNKNOWN_RULE`／`unknown-rule-blocked` 停止，而不是偷偷創造危機結果。

## 長期自動執行

`.github/workflows/ai-validation.yml`：

- 每次 push / PR：unit + headless tests、Prototype audit、structural Monte Carlo、500局快速 self-play。
- 每週一 11:17（台北時間）：再跑10,000局深度 self-play。
- 手動 workflow_dispatch：也會跑10,000局深度 self-play。
- JSON 結果保存為 GitHub Actions artifact 30天。

任何勝率或傳奇完成率，在 `balanceEligible` 變成 true 以前，都只能當工程／壓力測試訊號，不能自動改 V04。

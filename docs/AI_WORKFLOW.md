# 《家族天下》V04｜AI WORKFLOW

> AI 工作室流程。不是遊戲規則來源。
>
> 最後更新：2026-10-26

## 1. 四個 AI 職能

### A. 規則管理
追蹤【已定】【TEST】【待確認】【撤回】；維護規則來源；發現文件／Prototype／Simulation 差異；禁止把舊程式升格成規則。

### B. 遊戲測試
負責 invariant、property test、死局、行動超限、負資源、容量超限、婚姻矛盾、出生超限、終局無法結束等。

### C. AI 玩家模擬
只從合法選項中選擇；不決定什麼叫合法。

### D. 數位工程
維護 Prototype、Headless Engine、CI、Simulation；只有規則來源明確才同步。

## 2. 規則來源

永遠先讀 `CURRENT_RULES_INDEX.md`、`V04_CURRENT_RULES.md`，再讀 T2 data、crisis、open issues、implementation status。

Prototype 與 Simulation 永遠不是規則來源。

## 3. Headless 流程

```text
createGame
  ↓
state
  ↓
legalActions
  ↓
AI policy
  ↓
applyAction
  ↓
invariantCheck
  ↓
settlement
```

## 4. 未知規則處理

遇到【待確認】：不猜、不補預設、回報 unknown；strict mode 可中止。

若為 core sandbox，只能用明確列在 assumption profile 的假設；輸出必須帶出 assumption；固定 `balanceEligible:false`。

## 5. 測試結果最低要求

至少保存：rules snapshot、Git SHA、Seed、玩家數、家族、AI policy、assumption profile、coverage gaps、unknown rules、violations、回合數、終局原因、傳奇結果、是否可作正式 balance evidence。

## 6. AI 不得自動做

- 不因勝率差自動改 Setup。
- 不因缺規則自動發明危機。
- 不把 TEST 升格成已定。
- 不把 Prototype 舊值當新規則。
- 不把 `balanceEligible:false` 的數據當正式平衡結論。

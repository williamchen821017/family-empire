# 家族天下 V04｜AI 工作室流程

> 本文件是流程規範，不是遊戲規則來源。  
> 遊戲規則的最高依據仍是 V04 正式交接文件，以及其後由使用者明確確認的正式決策。

## 1. 規則來源層級

由高到低：

1. **V04 正式交接文件＋後續正式決策**：唯一權威規則來源。
2. **docs/IMPLEMENTATION_STATUS.md**：僅記錄目前理解／實作差異，不得反向覆蓋權威規則。
3. **瀏覽器 Prototype（v04/*.js）**：可執行實作；若衝突，視為實作待同步。
4. **sim/**：測試鏡像、假設與 AI；只用來找問題，不得自行創造正式規則。

## 2. 狀態標籤

- 【已定】：已明確確認。
- 【TEST】：允許測試但仍可調整。
- 【新提案】：可討論／模擬，不是規則。
- 【待確認】：缺資料；引擎必須停止、略過該覆蓋區，或使用明列的 assumption profile。
- 【撤回】：禁止復活，除非重新確認。

## 3. 四個 AI 職能

### 規則管理
追蹤來源、狀態與版本差異，不讓 Prototype 或模擬器反向決定桌遊規則。

### 遊戲測試
以 invariant / property test 搜尋：行動超限、負資源、容量超限、婚姻矛盾、出生超限、無法終局等。

### AI 玩家模擬
策略只從 `legalActions()` 回傳的合法行動中選；AI policy 沒有資格自行創造合法性。

### 數位工程
維護 headless engine 與 Prototype；規則未明確時不強制同步。

## 4. Headless Engine 現行流程

```
V04 權威決策
    ↓
rules-profile / explicit assumption profile
    ↓
createGame → state
    ↓
legalActions(state)
    ↓
AI policy
    ↓
applyAction(state, action)
    ↓
invariantCheck(state)
    ↓
settlement / 下一玩家
```

核心保證：

- `applyAction` 會重新核對 action 是否仍在合法行動清單。
- 每一步後執行 invariant。
- 同 Seed＋同家族＋同 policy 必須產生相同報告。
- 尚未實作的正式必要規則，在 strict mode 必須停止並記錄 unknown rule。
- core sandbox 可以用明列 assumption 跑回歸，但固定 `balanceEligible:false`。

## 5. 測試結果最低欄位

每份結果至少保存：
- ruleset / rules snapshot。
- Git commit SHA（CI 中）。
- Seed。
- 玩家數與家族。
- AI policies。
- assumption profile。
- coverage gaps / unknown rules。
- 違規發生位置。
- 行動使用量、回合數、傳奇結果。
- 是否具有正式 balance 判讀資格。

## 6. 不得自動做

- 不得因勝率差自動改 Setup。
- 不得因缺規則而補危機、王軍、NPC 婚姻。
- 不得把 TEST 升格成已定。
- 不得把 Prototype 舊值當正式 V04。
- 不得把 `balanceEligible:false` 的 self-play 當成正式平衡證據。

## 7. 長期運作

目前 GitHub Actions 會：

1. 每次 push / PR 跑 deterministic unit tests。
2. 稽核 Prototype 與現行 V04 的已知差異。
3. 跑 structural Monte Carlo。
4. 跑500局快速 headless regression self-play。
5. 每週另跑10,000局深度 self-play。
6. 保存 JSON artifact 30天。

若任何 invariant 違規，CI 直接失敗並留下可重播 Seed。  
若只是規則尚未覆蓋，報告列入 coverage gap / unknown rule，不自動修改規則。

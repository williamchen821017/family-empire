# 家族天下 V04｜AI 工作室流程

> 本文件是流程規範，不是遊戲規則來源。  
> 遊戲規則的最高依據仍是 V04 正式交接文件，以及其後由使用者明確確認的正式決策。

## 1. 規則來源層級

由高到低：

1. **V04 正式交接文件＋後續正式決策**：唯一權威規則來源。
2. **docs/IMPLEMENTATION_STATUS.md**：僅記錄「目前理解／實作差異」，不得反向覆蓋權威規則。
3. **瀏覽器 Prototype（v04/*.js）**：可執行實作；若與權威規則衝突，視為實作待同步。
4. **sim/**：測試模型與 AI 假設；只用來找問題，不得自行創造正式規則。

任何 AI、腳本或 Prototype 都不得因「程式目前如此」而把規則升格為【已定】。

## 2. 規則狀態標籤

- **【已定】**：使用者已明確確認，或權威交接文件明確記載。
- **【新提案】**：可以討論、模擬，但不得當成正式規則。
- **【待確認】**：缺乏足夠資訊；測試器必須停止使用該值，或以明確的 scenario override 執行。
- **【TEST】**：允許第一測使用的暫定值；報告中必須標記為 TEST。
- **【撤回】**：禁止在新實作中復活，除非使用者重新確認。

## 3. 四個 AI 職能

### A. 規則管理

負責：
- 記錄規則來源與狀態。
- 發現文件、Prototype、模擬器之間的差異。
- 不替【待確認】規則補預設值。
- 每次規則更新後標記需要同步的實作。

輸出：
- IMPLEMENTATION_STATUS 更新。
- 規則差異清單。
- 待確認問題。

### B. 遊戲測試

負責：
- 針對明確規則建立 invariant / property test。
- 搜尋死局、非法狀態、資源負值、行動超限、無法終局等。
- 對 TEST 值做敏感度測試，不把最佳結果自動改成正式值。

輸出至少包含：
- 測試規則版本。
- Git commit SHA。
- Seed。
- 玩家數。
- 測試項目。
- 違規位置／回合。
- 未定案規則清單。

### C. AI 玩家模擬

策略只決定「在合法行動中選哪一個」，不得決定什麼行動是否合法。

預設策略介面：
- random：隨機合法選擇。
- expansion：偏重產業、家兵與可持續資源。
- conservative：偏重保留資源、低風險與可逆行動。
- political：偏重仕途、婚姻、盟約、影響力與王廷機會。

完整自走對局必須等待可由 Node 匯入的權威 headless engine；目前不能用瀏覽器 Prototype 的舊規則冒充 V04。

### D. 數位工程

負責：
- Prototype／未來 headless engine 的程式實作。
- 只有在規則來源明確時才同步。
- 實作差異要記錄，不以程式碼反向決定桌遊規則。

## 4. 變更流程

每次規則或程式變更依序：

1. 找出來源：哪一份交接文件或哪一次正式決策。
2. 標記狀態：已定／TEST／待確認／撤回。
3. 判斷是否影響 Prototype、模擬器或測試。
4. 先更新差異追蹤，再改程式。
5. 執行 deterministic tests。
6. 保存 Seed、Git SHA、測試摘要。
7. 若測試發現設計問題，只回報，不自動修改規則。

## 5. 測試結果格式

JSON 結果至少保留：

```json
{
  "ruleset": "V04",
  "gitSha": "<commit>",
  "seed": "<seed>",
  "mode": "structural|selfplay|prototype-audit",
  "players": 5,
  "strategies": ["political", "random"],
  "violations": [],
  "unknownRules": [],
  "summary": {}
}
```

隨機測試如果無法用相同 Seed 重現，就不算有效的自動測試結果。

## 6. 不得自動做的事

- 不得因測試勝率差而自動改 Setup。
- 不得補完婚姻、危機、爵位等尚未定案內容。
- 不得把 Prototype 舊值升格成 V04 正式值。
- 不得默默把【TEST】改成【已定】。
- 不得為了讓模擬能跑而創造隱藏規則。

## 7. 現階段最小流程

目前 repo 先採：

```
權威 V04 決策
    ↓
IMPLEMENTATION_STATUS（差異鏡像）
    ↓
sim/rules-profile.mjs（只鏡像測試所需的少量明確參數）
    ↓
deterministic structural tests
    ↓
Prototype audit
    ↓
GitHub Actions 保存 JSON artifacts
```

等 headless engine 建立後，再把 AI policies 接到完整合法行動列表，開始真正 2–5 人大量自走對局。

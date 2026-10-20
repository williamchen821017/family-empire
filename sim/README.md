# V04 Simulation / AI Testing

這個資料夾的目的不是建立第二份遊戲規則，而是建立**可重播、可稽核、會拒絕猜規則**的測試基礎。

## 現在可以執行

### 1. 單元測試

```bash
node sim/test.mjs
```

檢查：
- Seed RNG 可重播
- 不同 AI policy 會有不同偏好
- 已確認結構參數存在
- 未確認規則不會偷偷得到預設值

### 2. Prototype 差異稽核

```bash
node sim/audit-prototype.mjs
node sim/audit-prototype.mjs --json
```

它只會標出已知「Prototype 尚未同步」的模式，不會替你修改規則。

目前差異是 warning，不會讓 CI 失敗，因為使用者已明確允許舊 Prototype 暫時不同步。

### 3. 結構型 Monte Carlo

```bash
node sim/run-structural.mjs --seed demo-001 --iterations 50000
node sim/run-structural.mjs --seed demo-001 --iterations 50000 --out artifacts/structural.json
```

目前只測「不需要完整玩家 AI 就能安全驗證」的結構，例如：
- T2 10張一般事件／6張◆下，第4個◆出現位置
- 2–5 人每回合桌面總主要行動量
- 每家重要出生在第4◆前的理論上限

## AI policies

`sim/policies.mjs` 已建立：
- random
- expansion
- conservative
- political

**重要：policy 只能從 headless engine 給的合法行動中選。**  
policy 本身沒有資格判定合法性，因此不能把 AI 假設變成規則。

## 還不能誠實宣稱完成的部分

目前 repo 沒有獨立 Node.js headless game engine；瀏覽器 `v04/*.js` 又包含舊規則與 DOM 依賴。

因此現在**不能**把舊 Prototype 包一層亂數選擇器，就宣稱已完成 V04 全自動 AI self-play。

完整自走測試需要下一階段：

1. 把規則核心拆成無 DOM 的 headless state / legal-actions / reducer。
2. 每條 reducer 規則都附 source id 與 status。
3. legal-actions 遇到【待確認】規則時回報 unknown，不自行決定。
4. policies 從合法行動中選擇。
5. runner 保存 seed、逐回合 state hash、違規位置與最終結果。

## GitHub Actions

`.github/workflows/ai-validation.yml` 會自動：
- 跑 sim unit tests
- 產生 Prototype audit JSON
- 用 commit SHA 當 Seed 跑 structural Monte Carlo
- 把 JSON 上傳為 Actions artifact

這讓每次工程變更都有可追溯的測試紀錄，而不需要額外付費工具。

# 《家族天下》V04｜PROGRAM STATUS

> 用途：沒有 ChatGPT Project 也能知道 repo 中哪一塊程式是什麼、可不可以信。
>
> 最後更新：2026-10-26

## 1. Repository

GitHub：`williamchen821017/family-empire`  
主分支：`main`

## 2. 最重要警告

**瀏覽器 Prototype 不是現行 V04 規則真相來源。**

Prototype 在較早 V04 階段建立，後來大量規則已重做。程式中有某個數值不代表正式規則已定；舊 Prototype 與 `V04_CURRENT_RULES.md` 衝突時，以規則文件為準。

## 3. 瀏覽器 Prototype

主要檔案方向：
- `index.html`
- `language.js`
- `v04/*.js`

可重用價值：
- 2–5人 Setup UI。
- 三輪主要行動的操作殼。
- 地圖／鄰接的程式表現。
- 骰子判定工具。
- 官職／人物／產業等資料結構概念。
- Pages 部署骨架。

目前落後規則的典型項目：依附戶、有效◆／連續◆失效、舊手牌、白鹿舊婚姻計分、家業豐足舊門檻、舊家族Setup、舊事件、舊爵位字串、重要出生逐婚姻判定。

不要直接以 Prototype 做正式平衡測試。

## 4. Headless Test Engine

核心資料流：

```text
state
  ↓
legalActions(state)
  ↓
AI policy
  ↓
applyAction(state, action)
  ↓
invariantCheck(state)
  ↓
settlement / next player
```

設計原則：AI policy 無權決定合法性；所有行動由 `legalActions()` 提供；`applyAction()` 再驗證；每步後執行 invariant；同 Seed＋同策略應可重播。

## 5. Headless 主要檔案

- `sim/rules-profile.mjs`
- `sim/lib/rng.mjs`
- `sim/policies.mjs`
- `sim/run-structural.mjs`
- `sim/audit-prototype.mjs`
- `sim/test.mjs`
- `sim/run-selfplay.mjs`
- `sim/test-headless.mjs`
- `sim/headless/state.mjs`
- `sim/headless/legal-actions.mjs`
- `sim/headless/apply-action.mjs`
- `sim/headless/invariants.mjs`
- `sim/headless/settlement.mjs`
- `sim/headless/legends.mjs`
- `sim/headless/engine.mjs`
- `sim/headless/data.mjs`
- `sim/headless/assumptions.mjs`
- `sim/headless/mechanics.mjs`

## 6. Headless 現在能做

- 2–5人 Setup。
- 七家測試資料。
- 每家3次主要行動。
- 人物行動×2／移動×1。
- 籌錢、買糧、取得產業。
- 組建／調動家兵、超額維持。
- 入仕、資歷2→3骨架。
- 玩家婚姻提案／接受／拒絕。
- ◆生產。
- 每家每◆最多1次重要出生。
- 成年成長、資歷成長、老化／死亡。
- 父系爵位繼承骨架。
- 四項傳奇。
- invariant 與 Seed replay。

## 7. Headless 尚未覆蓋

普通事件完整卡面效果、8種手牌完整整合、NPC名門婚姻、盟約、完整官職競逐、王軍、《王座上的少年》完整危機、清算、保全、新局安排、事件封爵完整效果、寡居／再婚未定細節。

因此所有 Headless 家族勝率目前必須標記：`balanceEligible: false`。

## 8. AI 玩家

目前策略：`random`、`expansion`、`conservative`、`political`。

AI 只在合法選項中選擇，不能為了讓遊戲跑下去創造規則。

## 9. GitHub Actions 方向

每次 push／PR：unit tests、headless tests、Prototype audit、structural Monte Carlo、快速 self-play。  
定期：深度 self-play。  
結果：JSON artifact、保留 Seed；invariant 違規應讓 CI 失敗。

## 10. 接手工程順序

1. 先讀 `CURRENT_RULES_INDEX.md`。
2. 再讀 `V04_CURRENT_RULES.md`。
3. 再看 `IMPLEMENTATION_STATUS.md`。
4. 才進程式。
5. 改程式前確認規則是【已定】還是【TEST】。
6. 【待確認】不得補預設值。

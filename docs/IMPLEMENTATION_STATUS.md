# V04｜規則與數位實作對照

> **非權威文件。**  
> 本檔只記錄目前桌遊主線與 repo 實作之間的同步狀態。若與 V04 正式交接文件／後續正式決策衝突，以後者為準。

最後盤點：2026-10-20

## Repo 真實狀態

目前 repo 有兩套不同目的的實作：

### 1. 瀏覽器 Prototype
- `index.html`、`language.js`、`v04/*.js`
- GitHub Pages
- 主要是 2026-10-06 的 V04 第一測快照
- **明顯落後目前正式決策，不可當規則來源**

### 2. Headless Test Engine MVP
- `sim/headless/*.mjs`
- `sim/run-selfplay.mjs`
- Seed deterministic
- `legalActions → applyAction → invariantCheck`
- 2–5人與四種 AI policy
- 可以長期自動跑 core-loop regression

目前仍沒有「完整 V04 全自動對局」：危機、王軍、NPC婚姻、手牌與部分事件效果仍列 coverage gap。因此 self-play 固定 `balanceEligible:false`。

## Headless MVP 已覆蓋

- 2–5人 Setup。
- 七家測試資料快照。
- 3次主要行動與輪流順序。
- 人物行動×2、正常移動×1。
- 籌措錢幣、買糧、取得產業。
- 組建／調動家兵與超額維持。
- 入仕、資歷2→3基本流程。
- 玩家—玩家婚姻與拒婚配對封鎖。
- T2 10張一般事件／6◆的牌序與開局平順抽牌結構；事件個別效果尚未全實作。
- ◆生產、每家每◆最多一次重要出生。
- 成年成長、資歷成長、老化、死亡。
- 五等爵男性持有的父系繼承骨架。
- 四項家族傳奇檢查。
- strict mode 的 unknown-rule stop。

## Headless coverage gaps

- 一般事件卡面完整效果。
- 8種手牌。
- NPC名門婚姻。
- 盟約。
- 重要官職完整任命競逐。
- 王軍。
- 《王座上的少年》危機、清算、保全、新局安排。
- 封爵事件與爵位資格完整效果。
- 寡婦再婚等未鎖細節。

## 瀏覽器 Prototype 已知同步差異

| 項目 | 現行 V04 主線 | 目前 Prototype |
|---|---|---|
| 計數資源 | 錢、糧、影響力、家兵；依附戶撤回 | 仍有依附戶 |
| ◆ | T2：10張一般事件中6張◆；◆即結算 | 仍有有效◆／連續◆失效 |
| 重要出生 | 每家每◆最多一次 | 對多段婚姻逐一判定 |
| 手牌 | 現行8種 | 仍保留舊12種內容 |
| 締結名門 | 本局新建立3個不同家族 | 仍把開局政治婚姻加進度 |
| 家業豐足 | 3產業＋錢糧20【TEST】 | 門檻仍為8 |
| 白鹿 | 既有名門接觸，不送進度 | `politicalMarriages:1` |
| 爵位 | 五等爵＋爵家身分／本人持爵 | 仍使用舊「王爵」 |
| 事件 | V2平順／機會／日常問題 | 仍是10/6事件文字 |

## 同步原則

1. Headless engine 優先用於測試，不強迫舊 Prototype 現在同步。
2. Headless 的 assumption profile 必須隨報告輸出。
3. 任何 coverage gap 都不能由 AI 偷補。
4. 未來每完成一塊正式規則，就從 coverage gap 移除並加入 regression test。

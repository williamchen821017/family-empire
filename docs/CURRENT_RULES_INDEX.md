# 《家族天下》V04｜CURRENT_RULES_INDEX

> 用途：規則來源導航與版本衝突管理。
>
> 本檔是索引，不是另一份規則書。
>
> 最後更新：2026-10-26  
> 快照版本：HANDOFF-2026-10-26-R2

## 1. 權威順序

由高到低：

1. V04 正式完整交接文件＋其後由使用者明確確認的正式決策。
2. `docs/V04_CURRENT_RULES.md`：目前已確認規則的整合版。
3. `docs/V04_PROJECT_STATE_2026-10-26.md`：目前專案進度快照。
4. `docs/V04_T2_DATA.md`：T2 人物、家族 Setup、事件、手牌、地圖等測試資料。
5. `docs/V04_YOUNG_KING_CRISIS.md`：《王座上的少年》危機骨架與版本衝突。
6. `docs/PROGRAM_STATUS.md`、`docs/IMPLEMENTATION_STATUS.md`：只決定程式同步到哪裡。
7. Prototype / Headless Engine / AI Simulation：都是實作／測試工具，不得反向決定桌遊規則。
8. 更舊 V03、V1、早期 V04、舊 Prototype 文件：只供歷史追溯。

## 2. 現役 Main

現役主線：

**🟢 Main｜家族天下｜V04｜主線開發（2026-10-26 後現役）**

舊的同名 Main 已達對話長度上限，視為：

**🔵 Archive｜家族天下｜V04｜主線開發｜01**

舊 Main 可查證歷史，但不再新增正式決策。

## 3. 規則狀態標籤

- 【已定】：正式決策，可實作。
- 【TEST】：第一測／平衡測試值，可調整。
- 【待確認】：尚未拍板，不得補值。
- 【新提案】：討論方案，尚未採用。
- 【撤回】：已刪除，不得因舊檔或舊程式自行復活。
- 【待核對｜版本衝突】：保存資料互相矛盾，必須等使用者重新確認。

## 4. 搬家修正

### 五能力正式名稱

玩家-facing 一律使用：
- 武略
- 治理
- 王心
- 交際
- 名望

「統率」不是現行玩家規則名稱。程式內部若仍用 `command` 可保留，但 UI／規則書／人物卡不得顯示成「統率」。

### 成長指定能力

不是少年專屬。現行人物資料中，兒童也可能已預先指定未來成長能力。因此人物卡規格應寫：

> 凡人物資料中存在預定成長能力，就以最小型固有提示標示。

不得寫成「只有少年卡才有成長指定數值」。

## 5. 已知版本衝突

### 《王座上的少年》三張前置節點

已知：
- 《宮門前的沉默》
- 《燈火直到深夜》
- 《來自松原的信》

版本 A：三張洗混後暗中移除 1 張，本局只出現 2 張。  
版本 B：三張全部出現，再進入《少年密林王的怒火》。

目前無法證明哪一版是最後正式決策，因此為：

> 【待核對｜版本衝突】

在重新確認以前：
- 規則書不得自行選邊。
- Headless Engine 不得補版本。
- Simulation 需要此流程時應回報 `UNKNOWN_RULE`。

## 6. 新聊天接手讀取順序

1. `docs/CURRENT_RULES_INDEX.md`
2. `docs/V04_CURRENT_RULES.md`
3. `docs/V04_PROJECT_STATE_2026-10-26.md`
4. `docs/V04_T2_DATA.md`
5. `docs/V04_YOUNG_KING_CRISIS.md`
6. `docs/OPEN_ISSUES.md`
7. `docs/ART_CHARACTER_CARD_SPEC.md`
8. `docs/ART_VISUAL_BIBLE_STATUS.md`
9. `docs/PROGRAM_STATUS.md`
10. `docs/AI_WORKFLOW.md`
11. `docs/IMPLEMENTATION_STATUS.md`

接手後：
- 不重新規劃已定核心。
- 不用舊 Prototype 推翻新規則。
- 不把 AI 推測寫成【已定】。
- 遇到版本衝突先標記。
- 使用者說「繼續調整數值」時，依 `OPEN_ISSUES.md` 的數值池繼續。

## 7. GitHub 的角色

GitHub 是：規則保存與交接中心、程式原始碼中心、AI 測試結果中心、美術規格文字中心。

GitHub 不是：自動把 Prototype 程式變成規則真相，也不是把 AI Simulation 結果自動變成新規則。

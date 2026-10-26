# 《家族天下》V04｜PROJECT STATE SNAPSHOT

> 用途：跨聊天搬遷、災難復原、專案接手。
>
> 這是階段性快照，不是新的獨立規則權威。
>
> 最後更新：2026-10-26  
> 版本：R2

## 1. 現況一句話

V04 已從大規模系統收斂進入：

> **第一套完整實體 Prototype 收尾 + 數值平衡 + 美術正式開工 + AI 自動測試基礎建設**

目前不重新設計核心遊戲。

## 2. 現行主線

原本的「🟢 Main｜家族天下｜V04｜主線開發」已達聊天長度上限，轉為 Archive。2026-10-26 起，新聊天承接現役主線。

規則來源見 `CURRENT_RULES_INDEX.md`。

## 3. 目前最重要的已定項目

- T2 10事件／6◆。
- 第4◆終局成熟。
- 3主要行動。
- 人物行動×2／移動×1。
- 4標籤／8永久主要行動。
- 五能力。
- 六生命階段。
- 每家每◆最多1次重要出生。
- 四項傳奇。
- 4計數資源。
- 根基有／無。
- 產業五類。
- 資歷1–5。
- 無家族關係數值軌的盟約。
- 家兵位置化。
- 王軍國有位置化。
- 五等爵。
- 爵家身分／本人持爵。
- 8種手牌。
- 人物卡 Token／Tile 原則。

## 4. 目前 TEST／待確認

- 產業供應／成本／容量。
- 買糧成本。
- 家兵容量／超額維持。
- 籌措錢幣 once/round。
- 松原—麥原鄰接。
- 王軍總量。
- 家業豐足門檻20。
- 至少1傳奇才可勝。
- 盟約解除時間。
- 《王座上的少年》三前置節點版本。

## 5. 七家平衡

主要平衡目標：4–5人，模型勝率家族差距希望約 ≤3pp，但不過度追求假精確。

目前婚姻規則更新後模型大致：
- 4人 spread 約3.36pp。
- 5人 spread 約3.15pp。
- 白鹿若計入開局名門接觸的小優勢後，可降到約2.55／2.36pp。

全桌共同勝利率模型：2p約28.6%、3p約9.2%、4p約3.2%、5p約1.1%。

這些是設計參考，不是實玩結果。

## 6. AI／工程進度

已建立：規則來源管理、Prototype 差異稽核、deterministic Seed RNG、structural Monte Carlo、random／expansion／conservative／political AI policy、Headless Engine MVP、legalActions、applyAction、invariantCheck、self-play runner、CI regression、定期深度 self-play 方向。

Headless 尚未完整覆蓋危機等內容，因此可抓工程漏洞與跑 core regression，但暫不可拿家族勝率作最終平衡證據。

## 7. 美術進度

已確立：密林動物文明、東亞／中亞／歐洲中古融合、自然／枝葉／森林材料語彙、不是泛用歐洲動物奇幻、人物卡大量動態狀態直接用 Token／Tile。

已做過方向性概念：夜梟官僚、白鹿貴族女性、銀狐高階貴族、山熊軍事貴族。

尚未完成：七家完整 Visual Bible、第一張正式人物卡 Mockup、家族板、地圖、Icon 系統。

## 8. 搬家稽核修正

確認修正一：五能力為武略／治理／王心／交際／名望，不是統率。

確認修正二：成長指定能力不只少年可能有，兒童資料中也存在預先指定能力；人物卡規格已修正。

待核對：《王座上的少年》三前置節點究竟3抽2，或三張全出。

## 9. 目前真正下一步

遊戲設計線：繼續數值調整、NPC名門、危機卡、爵位 inventory。

美術線：七家 Visual Bible、人物卡 Mockup。

AI工程線：逐步關閉 Headless coverage gaps，完整規則覆蓋後再把 `balanceEligible` 升為 true。

## 10. 接手時不要做

- 不要復活舊宿願。
- 不要復活家族關係軌。
- 不要復活依附戶。
- 不要用舊 Prototype 的白鹿婚姻進度。
- 不要用舊家業門檻。
- 不要把舊「王爵」當現行爵位。
- 不要把 AI 模型結果直接改成正式規則。
- 不要自行解決《王座上的少年》版本衝突。

## 11. 完整內容分檔

規則：`V04_CURRENT_RULES.md`  
T2資料：`V04_T2_DATA.md`  
危機：`V04_YOUNG_KING_CRISIS.md`  
未決：`OPEN_ISSUES.md`  
人物卡：`ART_CHARACTER_CARD_SPEC.md`  
美術：`ART_VISUAL_BIBLE_STATUS.md`  
程式：`PROGRAM_STATUS.md`、`IMPLEMENTATION_STATUS.md`  
AI：`AI_WORKFLOW.md`

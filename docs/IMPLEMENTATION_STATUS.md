# 《家族天下》V04｜IMPLEMENTATION STATUS

> 本檔不是規則來源。
>
> 用途：追蹤現行桌遊規則與瀏覽器 Prototype／Headless Engine 的差距。
>
> 最後更新：2026-10-26

## 1. 現況總結

repo 同時存在：
1. 瀏覽器 Prototype：可操作，但規則版本落後。
2. Headless Test Engine：新建，以 core-loop regression 為主，尚未覆蓋完整 V04。

## 2. Prototype 已知落後項目

|項目|現行V04|舊Prototype|
|---|---|---|
|資源|錢／糧／影響力／家兵|仍可能有依附戶|
|◆|每個◆都有效|仍可能有有效◆／連續◆失效|
|重要出生|每家每◆最多1次|舊版可能逐婚姻判定|
|手牌|現行8種|舊版可能仍有12種|
|締結名門|本局新連3個不同家族|舊版可能把開局婚姻加進度|
|家業豐足|3產業＋錢糧20【TEST】|舊版門檻較低|
|白鹿|開局名門接觸，不送進度|舊版可能直接送政治婚姻進度|
|爵位|五等爵|舊版可能有特殊王爵字串|
|事件|普通事件V2|舊版卡面|
|Setup|T2七家|舊資源／產業值|

## 3. Headless 已同步／覆蓋

已建立骨架：Setup、action loop、legal actions、action reducer、invariant、settlement、Seed RNG、AI policies、self-play、structural Monte Carlo、Prototype audit。

## 4. Headless coverage gaps

普通事件完整效果、手牌、NPC名門婚姻、盟約、完整官職競逐、王軍、《王座上的少年》完整危機、清算、保全、新局安排、封爵事件完整效果、寡居／再婚部分規則。

因此可以做 regression，但不能正式判斷最終勝率平衡。

## 5. 每次規則更新後

工程 AI 必須：
1. 找到規則來源。
2. 確認狀態。
3. 更新本檔。
4. 再改程式。
5. 跑 deterministic tests。
6. 保存 Seed。
7. 若發現設計問題只回報，不自動改規則。

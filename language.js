const languageData = {
    meta: {
        gameTitle: "家族天下"
    },

    ui: {
        gameSubtitle: "一場家族的歷史",
        createNewGame: "建立新遊戲",
        createGameTitle: "建立新遊戲",
        selectPlayerCount: "請選擇玩家人數",
        playerCountOption: "{count} 人",
        prototypeBadge: "V1 Alpha 02",
        prototypeNotice: "目前是可玩的垂直切片；未定案規則皆以 Prototype 假設測試。",
        turnSummary: "第 {turn} 回合・行動輪 {round}/{maxRound}",
        bonusTurnSummary: "第 {turn} 回合・額外行動",
        settlementSummary: "第 {turn} 回合・回合結算",
        currentActor: "目前行動家族：{family}",
        viewingAs: "測試視角",
        passAction: "略過本次行動",
        debugRestart: "重新建立本局",
        privateVault: "自家私庫",
        privateOnly: "僅自己可見",
        hand: "手牌",
        handCollapse: "收起手牌",
        handExpand: "展開手牌",
        handEmpty: "目前沒有手牌",
        viewCard: "查看卡牌",
        useCard: "使用這張牌",
        unavailableTiming: "現在不是這張牌可以使用的時機。",
        cardUsed: "已使用「{card}」。",
        actionTokens: "本回合行動",
        familyAbility: "家族特性",
        influenceTrack: "影響力",
        relationships: "正式關係",
        relationshipBenefit: "關係利益",
        relationshipBreakCost: "解除／背約代價",
        relationshipEmpty: "目前沒有受機制綁定的正式關係。",
        industries: "家族產業",
        industryCapacity: "可管理 {count} 項產業",
        industryStartingRule: "起始產業",
        industrySupply: "產業供應",
        industrySupplyHint: "公開供應中的厚紙板產業 Tile。",
        industryFull: "家族產業槽已滿。",
        gainIndustry: "取得這項產業",
        industryPrototypeAction: "Prototype：把取得產業視為一次家族行動，不支付其他成本。",
        industryIncome: "回合收益",
        industryGained: "已取得「{industry}」。",
        industrySettlement: "產業收益結算",
        noIndustry: "尚無產業",
        genealogy: "族譜",
        familyBoard: "家族主板",
        clickBoardHint: "點擊可平面查看",
        familyPublicOverview: "家族公開資訊",
        publicMemberStatus: "公開人物狀態",
        familyMembers: "家族成員",
        office: "官職",
        lifeStage: "生命階段",
        currentStates: "目前狀態",
        noStates: "目前沒有 Buff／Debuff",
        abilities: "能力",
        noOffice: "無官職",
        officeHolder: "實際任官者",
        officePower: "任官勢力",
        publicSpace: "公共領域",
        publicSpacePrototype: "Prototype 公共行動",
        publicSpaceEffect: "派一名符合條件的人物前往；本版測試效果為影響力 +1。",
        sendCharacter: "派遣人物",
        chooseCharacter: "選擇人物",
        noEligibleCharacter: "沒有可派遣的人物。",
        characterBusy: "本回合已派遣",
        characterAvailable: "可派遣",
        taskDeck: "任務牌堆",
        taskDiscard: "任務棄牌",
        eventDeck: "事件牌堆",
        eventDiscard: "事件棄牌",
        drawTask: "查看最上方任務",
        taskDeckEmpty: "任務牌堆已空。",
        executeTask: "執行任務",
        declineTask: "先不執行",
        taskRequirementPrototype: "本版暫時只檢查指定官職；其他適用條件待後續規則完成。",
        taskNotQualified: "目前行動家族沒有符合這張任務的任官角色。",
        taskPerformer: "執行角色：{name}",
        preTaskWindow: "任務開始前",
        preTaskWindowHint: "現在可以使用符合時機的手牌，也可以依任務規則進行事前介入。",
        postTaskWindow: "結果確定前",
        postTaskWindowHint: "任務若允許，可在這裡進行事後介入。",
        currentAbility: "目前能力",
        originalRoll: "原始骰子",
        finalRoll: "最終骰子",
        result: "結果",
        directRoll: "直接擲骰",
        acceptResult: "接受目前結果",
        taskComplete: "任務完成",
        insufficientResource: "{resource}不足，無法進行這次介入。",
        resourceIntervention: "資源介入",
        cardTiming: "使用時機",
        cardType: "類型",
        cardEffect: "效果",
        cardDiscard: "使用後棄牌",
        eventCurrent: "目前世界事件",
        eventNoEffect: "本版事件只測試版面與流程，暫不產生數值效果。",
        activeNpc: "活躍 NPC",
        activeNpcHint: "只有本局真正登場的人物才會放在這裡。",
        prototypeArt: "Prototype 圖像區",
        npcMarker: "NPC",
        emptySlot: "空缺",
        turnSettlement: "回合結算",
        settlementText: "先結算各家產業收益，再進入換幕／時間流逝。",
        timePasses: "換幕／時間流逝",
        timePassesPrototype: "本版只重置人物派遣與行動 Token；年齡、生命事件等尚未接入。",
        nextTurn: "進入下一回合",
        bonusActionGranted: "本回合額外行動 +{count}",
        bonusActionRemaining: "剩餘額外行動：{count}",
        actionAlreadyRunning: "目前正在處理另一個行動。",
        activeFamilyOnly: "只有目前行動家族可以執行。",
        clickOutsideToClose: "點視窗外空白處關閉",
        prototypeAutoIndustry: "Prototype：目前依家族起始規則自動隨機取得 1 項產業；正式版之後改成抽取後由玩家選擇。",
        taskOutcomeSymbols: {
            failure: "✕",
            success: "✓",
            greatWin: "✓✓",
            greatVictory: "★"
        }
    },

    phases: {
        actionRounds: "輪流行動",
        bonusActions: "額外行動",
        settlement: "回合結算"
    },

    resources: {
        money: "錢",
        grain: "糧食",
        influence: "影響力",
        households: "民戶",
        retainers: "部曲"
    },

    abilities: {
        martial: "武略",
        administration: "政務",
        imperialFavor: "君心",
        social: "交際",
        reputation: "名望"
    },

    lifeStages: {
        child: "小孩",
        youth: "少年",
        adult: "成年",
        prime: "壯年",
        old: "老年"
    },

    board: {
        centralTitle: "天下與朝廷",
        courtArea: "皇帝／宗室",
        courtPlaceholder: "皇帝、皇后、太子與重要宗室位置",
        officeArea: "官職",
        officeCentral: "中央官",
        officeLocal: "地方官",
        publicArea: "公共領域",
        worldEventArea: "世界事件",
        industryArea: "產業供應",
        taskDeck: "任務牌堆",
        taskDiscard: "任務棄牌",
        eventDeck: "事件牌堆",
        eventDiscard: "事件棄牌"
    },

    family: {
        defaultName: "第 {number} 家族",
        crestShort: "家{number}",
        genealogyTitle: "{family}族譜",
        boardTitle: "{family}家族主板",
        influenceMaxLabel: "盛",
        influenceMinLabel: "微"
    },

    familyTemplates: {
        familyA: {
            name: "河東家（Prototype）",
            abilityName: "鄉里舊望（Prototype）",
            abilityText: "正式效果尚未定案；本版只測試家族主板上的固定能力區。",
            startingIndustryRule: "田產類：抽 2 選 1（本版自動隨機取得 1）"
        },
        familyB: {
            name: "河北家（Prototype）",
            abilityName: "故舊廣布（Prototype）",
            abilityText: "正式效果尚未定案；本版只測試不同家族具有不同固定能力文字。",
            startingIndustryRule: "商業類：抽 2 選 1（本版自動隨機取得 1）"
        },
        familyC: {
            name: "關中家（Prototype）",
            abilityName: "部眾相從（Prototype）",
            abilityText: "正式效果尚未定案；之後會依家族背景重新設計。",
            startingIndustryRule: "牧業類：抽 2 選 1（本版自動隨機取得 1）"
        },
        familyD: {
            name: "洛陽家（Prototype）",
            abilityName: "中朝門路（Prototype）",
            abilityText: "正式效果尚未定案；目前只測試版面與資訊層級。",
            startingIndustryRule: "商業類：抽 2 選 1（本版自動隨機取得 1）"
        },
        familyE: {
            name: "河內家（Prototype）",
            abilityName: "根基深厚（Prototype）",
            abilityText: "正式效果尚未定案；目前只測試家族差異化位置。",
            startingIndustryRule: "田產類：抽 2 選 1（本版自動隨機取得 1）"
        }
    },

    characters: {
        head: "家主",
        memberA: "族人甲",
        memberB: "族人乙"
    },

    offices: {
        chiefSecretary: "尚書令",
        secretary: "尚書",
        provincialGovernor: "州刺史"
    },

    npc: {
        npcA: {
            name: "崔某（Prototype）",
            role: "中樞官員"
        },
        npcB: {
            name: "宗室某王（Prototype）",
            role: "宗室人物"
        }
    },

    cards: {
        types: {
            contact: "人脈",
            mobilization: "可調度資產"
        },
        timing: {
            ownTurnFree: "自己的行動時・不消耗行動",
            beforeTaskRoll: "任務擲骰前",
            afterTaskRoll: "任務擲骰後、正式結算前",
            ownAction: "作為一次家族行動",
            settlement: "回合結算時",
            reaction: "符合指定事件時立即回應"
        },
        oldFriend: {
            name: "故交來援",
            subtitle: "舊遊之誼，臨事相助",
            type: "人脈",
            timing: "任務擲骰前",
            text: "本次任務的執行人物能力 +1。",
            flavor: "少時結交，未必日日往來；到了真正需要人手的時候，舊情也許仍有分量。"
        },
        rapidMobilization: {
            name: "臨時調度",
            subtitle: "把原本散在各處的人力與資源暫時收攏",
            type: "可調度資產",
            timing: "自己的行動時・不消耗行動",
            text: "本回合獲得 1 次額外行動。",
            flavor: "不是憑空多出時間，而是家族把原本分散的能力集中到眼前最重要的事情。"
        }
    },

    tasks: {
        banditSuppression: {
            type: "地方／武力（分類待定）",
            title: "夜火連村",
            name: "剿匪",
            description: "州境近來盜匪四起，數處村落接連遭劫。州刺史奉命整頓地方，須在事態擴大之前平息亂象。",
            suitableOffice: "州刺史",
            ability: "武略",
            resultGuide: "1–2 ✕　3–4 ✓　5 ✓✓　6 ★",
            results: {
                failure: {
                    name: "失敗",
                    effect: "糧食 -2"
                },
                success: {
                    name: "成功",
                    effect: "影響力 +1"
                },
                greatWin: {
                    name: "大勝",
                    effect: "影響力 +2、錢 +1"
                },
                greatVictory: {
                    name: "大捷",
                    effect: "影響力 +3；特殊獎勵尚未定案"
                }
            },
            interventions: {
                preAction: {
                    title: "要徵集當地援軍嗎？",
                    rule: "花費 {cost} {resource}，本次擲 {diceCount} 顆骰子並採用較高結果。",
                    buttonText: "徵集周邊塢堡武裝，一同守衛鄉里",
                    declineButtonText: "直接出兵"
                },
                postAction: {
                    title: "要在結果確定前再設法補救嗎？",
                    rule: "花費 {cost} {resource}重新擲骰，新的結果取代原本結果。",
                    buttonTextByResult: {
                        failure: "再調集人手，設法挽回局勢",
                        success: "增派人手，冒險爭取更好的戰果",
                        greatWin: "乘勢追擊，嘗試進一步擴大戰果",
                        greatVictory: "戰果已極為出色，仍要冒險重新部署嗎？"
                    },
                    rerollNarrative: {
                        same: "重新部署後，局勢並未明顯改變，最終仍是「{newResultName}」。",
                        better: "重新部署奏效，戰局有所改善，結果由「{originalResultName}」提升為「{newResultName}」。",
                        worse: "重新部署反而打亂了原有優勢，結果由「{originalResultName}」惡化為「{newResultName}」。"
                    }
                }
            }
        }
    },

    industries: {
        types: {
            land: "田產類（Prototype）",
            trade: "商業類（Prototype）",
            pastoral: "牧業類（Prototype）"
        },
        estateA: {
            name: "河畔田產（Prototype）",
            type: "田產類（Prototype）",
            text: "回合結算：糧食 +1。",
            flavor: "正式名稱與歷史設定之後考據。"
        },
        estateB: {
            name: "近郊田產（Prototype）",
            type: "田產類（Prototype）",
            text: "回合結算：糧食 +1。",
            flavor: "正式名稱與歷史設定之後考據。"
        },
        tradeA: {
            name: "市易產業甲（Prototype）",
            type: "商業類（Prototype）",
            text: "回合結算：錢 +1。",
            flavor: "正式名稱與制度背景之後考據。"
        },
        tradeB: {
            name: "市易產業乙（Prototype）",
            type: "商業類（Prototype）",
            text: "回合結算：錢 +1。",
            flavor: "正式名稱與制度背景之後考據。"
        },
        pastoralA: {
            name: "牧業資產甲（Prototype）",
            type: "牧業類（Prototype）",
            text: "回合結算：糧食 +1。",
            flavor: "正式名稱與制度背景之後考據。"
        },
        pastoralB: {
            name: "牧業資產乙（Prototype）",
            type: "牧業類（Prototype）",
            text: "回合結算：錢 +1。",
            flavor: "正式名稱與制度背景之後考據。"
        }
    },

    events: {
        quietCourt: {
            title: "朝局暫安（Prototype）",
            description: "本回合沒有額外世界效果。"
        }
    }
};

function getText(text, variables = {}) {
    let result = text;

    Object.keys(variables).forEach(function (key) {
        result = result.replaceAll(
            `{${key}}`,
            String(variables[key])
        );
    });

    return result;
}

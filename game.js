const BASE_ACTION_ROUNDS = 3;
const CAMERA_DEFAULT_SCALE = 0.72;
const CAMERA_MIN_SCALE = 0.48;
const CAMERA_MAX_SCALE = 1.65;
const CAMERA_WHEEL_SENSITIVITY = 0.0011;
const CAMERA_KEY_PAN_STEP = 70;
const FAMILY_INFLUENCE_TRACK_MAX = 12;

const PRIVATE_RESOURCE_KEYS = [
    "money",
    "grain",
    "households",
    "retainers"
];

const abilityResultTable = {
    1: {
        failure: [1, 2, 3, 4],
        success: [5, 6],
        greatWin: [],
        greatVictory: []
    },
    2: {
        failure: [1, 2, 3],
        success: [4, 5],
        greatWin: [6],
        greatVictory: []
    },
    3: {
        failure: [1, 2],
        success: [3, 4],
        greatWin: [5],
        greatVictory: [6]
    },
    4: {
        failure: [1],
        success: [2, 3, 4],
        greatWin: [5],
        greatVictory: [6]
    },
    5: {
        failure: [1],
        success: [2, 3],
        greatWin: [4, 5],
        greatVictory: [6]
    }
};

const taskResultRank = {
    failure: 0,
    success: 1,
    greatWin: 2,
    greatVictory: 3
};

const taskData = {
    banditSuppression: {
        requiredOffice: "provincialGovernor",
        ability: "martial",
        results: {
            failure: {
                resourceChanges: {
                    grain: -2
                }
            },
            success: {
                resourceChanges: {
                    influence: 1
                }
            },
            greatWin: {
                resourceChanges: {
                    influence: 2,
                    money: 1
                }
            },
            greatVictory: {
                resourceChanges: {
                    influence: 3
                }
            }
        },
        interventions: {
            preAction: {
                available: true,
                resource: "money",
                cost: 2,
                effect: "rollKeepHighest",
                diceCount: 2
            },
            postAction: {
                available: true,
                resource: "money",
                cost: 2,
                effect: "reroll"
            }
        }
    }
};

const cardData = {
    oldFriend: {
        timing: "beforeTaskRoll",
        effect: "taskAbilityModifier",
        value: 1,
        discardAfterUse: true
    },
    rapidMobilization: {
        timing: "ownTurnFree",
        effect: "bonusAction",
        value: 1,
        discardAfterUse: true
    }
};

const familyTemplateData = {
    familyA: {
        startingIndustryType: "land"
    },
    familyB: {
        startingIndustryType: "trade"
    },
    familyC: {
        startingIndustryType: "pastoral"
    },
    familyD: {
        startingIndustryType: "trade"
    },
    familyE: {
        startingIndustryType: "land"
    }
};

const industryData = {
    estateA: {
        type: "land",
        yield: {
            grain: 1
        }
    },
    estateB: {
        type: "land",
        yield: {
            grain: 1
        }
    },
    tradeA: {
        type: "trade",
        yield: {
            money: 1
        }
    },
    tradeB: {
        type: "trade",
        yield: {
            money: 1
        }
    },
    pastoralA: {
        type: "pastoral",
        yield: {
            grain: 1
        }
    },
    pastoralB: {
        type: "pastoral",
        yield: {
            money: 1
        }
    }
};

const npcData = {
    npcA: {
        id: "npcA",
        languageId: "npcA",
        lifeStage: "prime",
        officeType: "secretary",
        states: [],
        abilities: {
            martial: 2,
            administration: 4,
            imperialFavor: 3,
            social: 3,
            reputation: 3
        }
    },
    npcB: {
        id: "npcB",
        languageId: "npcB",
        lifeStage: "adult",
        officeType: null,
        states: [],
        abilities: {
            martial: 3,
            administration: 2,
            imperialFavor: 3,
            social: 4,
            reputation: 2
        }
    }
};

const gameState = {
    playerCount: null,
    players: [],
    turn: 1,
    phase: "actionRounds",
    actionRound: 1,
    activePlayerIndex: 0,
    viewingPlayerIndex: 0,
    bonusQueue: [],
    actionInProgress: false,
    currentTask: null,

    world: {
        currentEvent: null,
        eventDeck: [],
        eventDiscard: [],
        taskDeck: [],
        taskDiscard: [],
        publicSpaces: {
            publicSpaceA: {
                id: "publicSpaceA",
                occupants: []
            }
        },
        industryDeck: [],
        industrySupply: []
    },

    camera: {
        scale: CAMERA_DEFAULT_SCALE,
        panX: 0,
        panY: 0
    },

    ui: {
        handCollapsed: false,
        modalLocked: false
    }
};

const app = document.getElementById("app");
document.title = languageData.meta.gameTitle;

renderMainMenu();

function renderMainMenu() {
    app.innerHTML = `
        <section class="main-menu">
            <h1>${languageData.meta.gameTitle}</h1>
            <p>${languageData.ui.gameSubtitle}</p>
            <button
                id="new-game-button"
                class="primary-button"
                type="button">
                ${languageData.ui.createNewGame}
            </button>
        </section>
    `;

    document
        .getElementById("new-game-button")
        .addEventListener("click", renderPlayerCountSetup);
}

function renderPlayerCountSetup() {
    const buttons = [2, 3, 4, 5]
        .map(function (count) {
            return `
                <button
                    class="secondary-button"
                    type="button"
                    data-player-count="${count}">
                    ${getText(
                        languageData.ui.playerCountOption,
                        { count: count }
                    )}
                </button>
            `;
        })
        .join("");

    app.innerHTML = `
        <section class="setup-screen">
            <h1>${languageData.ui.createGameTitle}</h1>
            <p>${languageData.ui.selectPlayerCount}</p>
            <div class="player-count-options">
                ${buttons}
            </div>
        </section>
    `;

    document
        .querySelectorAll("[data-player-count]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                startGame(Number(button.dataset.playerCount));
            });
        });
}

function startGame(playerCount) {
    gameState.playerCount = playerCount;
    gameState.players = [];
    gameState.turn = 1;
    gameState.phase = "actionRounds";
    gameState.actionRound = 1;
    gameState.activePlayerIndex = 0;
    gameState.viewingPlayerIndex = 0;
    gameState.bonusQueue = [];
    gameState.actionInProgress = false;
    gameState.currentTask = null;
    gameState.camera.scale = CAMERA_DEFAULT_SCALE;
    gameState.camera.panX = 0;
    gameState.camera.panY = 0;
    gameState.ui.handCollapsed = false;
    gameState.ui.modalLocked = false;

    gameState.world.taskDeck = createPrototypeTaskDeck();
    gameState.world.taskDiscard = [];
    gameState.world.eventDeck = createPrototypeEventDeck();
    gameState.world.eventDiscard = [];
    gameState.world.currentEvent = null;
    gameState.world.publicSpaces.publicSpaceA.occupants = [];
    gameState.world.industryDeck = createPrototypeIndustryDeck();
    gameState.world.industrySupply = [];

    const familyTemplateIds = Object.keys(familyTemplateData);

    for (let index = 0; index < playerCount; index += 1) {
        gameState.players.push(
            createPrototypePlayer(
                index,
                familyTemplateIds[index]
            )
        );
    }

    assignPrototypeStartingIndustries();
    refillIndustrySupply();
    beginTurn();
    renderGameTable();
}

function createPrototypePlayer(index, templateId) {
    const templateLanguage =
        languageData.familyTemplates[templateId];

    return {
        id: `player-${index + 1}`,
        name: templateLanguage.name,
        colorIndex: index,
        templateId: templateId,
        resources: {
            money: 5,
            grain: 5,
            influence: 0,
            households: null,
            retainers: null
        },
        members: [
            createPrototypeMember(index, 0, "head", "prime"),
            createPrototypeMember(index, 1, "memberA", "adult"),
            createPrototypeMember(index, 2, "memberB", "youth")
        ],
        hand: ["oldFriend", "rapidMobilization"],
        discard: [],
        activeCards: [],
        relationships: [],
        industries: [],
        industryCapacity: 4,
        normalActionsTaken: 0,
        bonusActions: 0,
        bonusActionsTaken: 0
    };
}

function createPrototypeMember(
    playerIndex,
    memberIndex,
    languageKey,
    lifeStage
) {
    const abilitySets = [
        {
            martial: 3,
            administration: 3,
            imperialFavor: 3,
            social: 3,
            reputation: 3
        },
        {
            martial: 4,
            administration: 2,
            imperialFavor: 2,
            social: 3,
            reputation: 2
        },
        {
            martial: 2,
            administration: 4,
            imperialFavor: 3,
            social: 4,
            reputation: 3
        }
    ];

    return {
        id: `player-${playerIndex + 1}-member-${memberIndex + 1}`,
        name: languageData.characters[languageKey],
        lifeStage: lifeStage,
        officeType:
            memberIndex === 0
                ? "provincialGovernor"
                : null,
        states: [],
        busyThisTurn: false,
        abilities: abilitySets[memberIndex]
    };
}

function createPrototypeTaskDeck() {
    return [0, 1, 2].map(function (index) {
        return {
            instanceId: `task-${index + 1}`,
            taskId: "banditSuppression"
        };
    });
}

function createPrototypeEventDeck() {
    return [
        {
            instanceId: "event-1",
            eventId: "quietCourt"
        }
    ];
}

function createPrototypeIndustryDeck() {
    const industryIds = Object.keys(industryData);
    const deck = [];
    let serial = 1;

    industryIds.forEach(function (industryId) {
        for (let copy = 0; copy < 2; copy += 1) {
            deck.push({
                instanceId: `industry-${serial}`,
                industryId: industryId
            });
            serial += 1;
        }
    });

    return shuffleArray(deck);
}

function assignPrototypeStartingIndustries() {
    gameState.players.forEach(function (player) {
        const type =
            familyTemplateData[player.templateId]
                .startingIndustryType;
        const candidateIndexes = [];

        gameState.world.industryDeck.forEach(
            function (instance, index) {
                if (
                    industryData[instance.industryId].type ===
                    type
                ) {
                    candidateIndexes.push(index);
                }
            }
        );

        if (candidateIndexes.length === 0) {
            return;
        }

        const chosenIndex =
            candidateIndexes[
                Math.floor(
                    Math.random() * candidateIndexes.length
                )
            ];

        const chosen =
            gameState.world.industryDeck.splice(
                chosenIndex,
                1
            )[0];

        player.industries.push(chosen);
    });
}

function refillIndustrySupply() {
    while (
        gameState.world.industrySupply.length < 5 &&
        gameState.world.industryDeck.length > 0
    ) {
        gameState.world.industrySupply.push(
            gameState.world.industryDeck.shift()
        );
    }
}

function beginTurn() {
    gameState.phase = "actionRounds";
    gameState.actionRound = 1;
    gameState.activePlayerIndex = 0;
    gameState.viewingPlayerIndex = 0;
    gameState.bonusQueue = [];
    gameState.actionInProgress = false;
    gameState.currentTask = null;
    gameState.world.publicSpaces.publicSpaceA.occupants = [];

    gameState.players.forEach(function (player) {
        player.normalActionsTaken = 0;
        player.bonusActions = 0;
        player.bonusActionsTaken = 0;

        player.members.forEach(function (member) {
            member.busyThisTurn = false;
        });
    });

    if (
        !gameState.world.currentEvent &&
        gameState.world.eventDeck.length > 0
    ) {
        gameState.world.currentEvent =
            gameState.world.eventDeck.shift();
    }
}

function renderGameTable() {
    const activePlayer = getActivePlayer();

    app.innerHTML = `
        <section class="game-screen">
            ${renderTopbar(activePlayer)}

            <section
                id="table-viewport"
                class="table-viewport">
                <div id="camera-world" class="camera-world">
                    ${renderCentralBoard()}
                    ${renderActiveNpcArea()}
                    ${renderPlayerAreas()}
                </div>
            </section>

            ${renderHandDrawer()}

            <div id="modal-overlay" class="modal-overlay" hidden>
                <div id="modal-panel" class="modal-panel"></div>
            </div>
        </section>
    `;

    bindGameTableEvents();
    applyCameraTransform();
}

function renderTopbar(activePlayer) {
    const viewingOptions = gameState.players
        .map(function (player, index) {
            return `
                <option
                    value="${index}"
                    ${
                        index === gameState.viewingPlayerIndex
                            ? "selected"
                            : ""
                    }>
                    ${player.name}
                </option>
            `;
        })
        .join("");

    return `
        <header class="game-topbar">
            <div class="game-title-block">
                <h1>${languageData.meta.gameTitle}</h1>
                <p>
                    <span class="prototype-tag">
                        ${languageData.ui.prototypeBadge}
                    </span>
                    ${languageData.ui.prototypeNotice}
                </p>
            </div>

            <div class="turn-status">
                <strong>${getPhaseStatusText()}</strong>
                <span>
                    ${getText(
                        languageData.ui.currentActor,
                        { family: activePlayer.name }
                    )}
                </span>
            </div>

            <div class="topbar-tools">
                <label class="viewing-select-wrap">
                    <span>${languageData.ui.viewingAs}</span>
                    <select id="viewing-player-select">
                        ${viewingOptions}
                    </select>
                </label>

                <button
                    id="pass-action-button"
                    class="ghost-button"
                    type="button"
                    ${
                        !isViewingActivePlayer() ||
                        gameState.actionInProgress ||
                        gameState.phase === "settlement"
                            ? "disabled"
                            : ""
                    }>
                    ${languageData.ui.passAction}
                </button>

                <button
                    id="restart-game-button"
                    class="ghost-button"
                    type="button">
                    ${languageData.ui.debugRestart}
                </button>
            </div>
        </header>
    `;
}

function getPhaseStatusText() {
    if (gameState.phase === "bonusActions") {
        return getText(
            languageData.ui.bonusTurnSummary,
            { turn: gameState.turn }
        );
    }

    if (gameState.phase === "settlement") {
        return getText(
            languageData.ui.settlementSummary,
            { turn: gameState.turn }
        );
    }

    return getText(
        languageData.ui.turnSummary,
        {
            turn: gameState.turn,
            round: gameState.actionRound,
            maxRound: BASE_ACTION_ROUNDS
        }
    );
}

function renderCentralBoard() {
    return `
        <div class="central-board-stage">
            <section class="central-board">
                <h2 class="board-title">
                    ${languageData.board.centralTitle}
                </h2>

                <section class="board-zone court-zone">
                    <h3>${languageData.board.courtArea}</h3>
                    <p>${languageData.board.courtPlaceholder}</p>
                </section>

                <section class="board-zone office-zone">
                    <h3>${languageData.board.officeArea}</h3>
                    ${renderOfficeGrid()}
                </section>

                <section class="board-zone industry-zone">
                    <h3>${languageData.board.industryArea}</h3>
                    ${renderIndustrySupply()}
                </section>

                <section class="board-zone public-zone">
                    <h3>${languageData.board.publicArea}</h3>
                    ${renderPublicSpaces()}
                </section>

                <section class="board-zone event-zone">
                    <h3>${languageData.board.worldEventArea}</h3>
                    ${renderCurrentEvent()}
                </section>

                <section class="board-zone task-deck-zone">
                    <button
                        id="task-deck-stack"
                        class="deck-stack interactive"
                        type="button">
                        ${languageData.board.taskDeck}<br>
                        ${gameState.world.taskDeck.length}
                    </button>
                </section>

                <section class="board-zone task-discard-zone">
                    <div class="discard-stack">
                        ${languageData.board.taskDiscard}<br>
                        ${gameState.world.taskDiscard.length}
                    </div>
                </section>

                <section class="board-zone event-deck-zone">
                    <div class="deck-stack">
                        ${languageData.board.eventDeck}<br>
                        ${gameState.world.eventDeck.length}
                    </div>
                </section>

                <section class="board-zone event-discard-zone">
                    <div class="discard-stack">
                        ${languageData.board.eventDiscard}<br>
                        ${gameState.world.eventDiscard.length}
                    </div>
                </section>
            </section>
        </div>
    `;
}

function renderOfficeGrid() {
    const localOffices = gameState.players
        .map(function (player) {
            const holder = player.members.find(function (member) {
                return member.officeType === "provincialGovernor";
            });

            return `
                <div class="office-slot">
                    <span class="office-slot-name">
                        ${languageData.offices.provincialGovernor}
                    </span>
                    <button
                        class="office-marker family-color-${player.colorIndex} interactive"
                        type="button"
                        data-office-player-id="${player.id}"
                        data-office-member-id="${holder.id}">
                        ${getText(
                            languageData.family.crestShort,
                            { number: player.colorIndex + 1 }
                        )}
                    </button>
                </div>
            `;
        })
        .join("");

    return `
        <div class="office-grid">
            <div class="office-section-label">
                ${languageData.board.officeCentral}
            </div>

            <div class="office-slot">
                <span class="office-slot-name">
                    ${languageData.offices.chiefSecretary}
                </span>
                <span>${languageData.ui.emptySlot}</span>
            </div>

            <div class="office-slot">
                <span class="office-slot-name">
                    ${languageData.offices.secretary}
                </span>
                <button
                    class="office-marker npc-marker interactive"
                    type="button"
                    data-npc-id="npcA">
                    ${languageData.ui.npcMarker}
                </button>
            </div>

            <div class="office-section-label">
                ${languageData.board.officeLocal}
            </div>

            ${localOffices}
        </div>
    `;
}

function renderIndustrySupply() {
    if (gameState.world.industrySupply.length === 0) {
        return `<p>${languageData.ui.noIndustry}</p>`;
    }

    return `
        <div class="industry-supply-stack">
            ${gameState.world.industrySupply
                .map(function (instance) {
                    const data =
                        industryData[instance.industryId];
                    const text =
                        languageData.industries[
                            instance.industryId
                        ];

                    return `
                        <button
                            class="industry-tile-mini interactive"
                            type="button"
                            data-industry-instance-id="${instance.instanceId}">
                            <strong>${text.name}</strong>
                            <span>
                                ${languageData.industries.types[data.type]}
                            </span>
                        </button>
                    `;
                })
                .join("")}
        </div>
    `;
}

function renderPublicSpaces() {
    const occupants =
        gameState.world.publicSpaces.publicSpaceA.occupants
            .map(function (occupant) {
                const player = getPlayerById(occupant.playerId);
                const member = getMemberById(
                    player,
                    occupant.memberId
                );

                return `
                    <span
                        class="meeple family-color-${player.colorIndex}"
                        title="${player.name}・${member.name}">
                        ${member.name}
                    </span>
                `;
            })
            .join("");

    return `
        <button
            id="public-space-a"
            class="public-action-space interactive"
            type="button">
            <strong>${languageData.ui.publicSpacePrototype}</strong>
            <span>${languageData.ui.publicSpaceEffect}</span>
            <span class="public-occupants">
                ${occupants || languageData.ui.emptySlot}
            </span>
        </button>

        <div class="public-action-space">
            <strong>${languageData.ui.industrySupply}</strong>
            <span>${languageData.ui.industryPrototypeAction}</span>
        </div>
    `;
}

function renderCurrentEvent() {
    if (!gameState.world.currentEvent) {
        return `
            <div class="event-card-mini">
                <strong>${languageData.ui.eventCurrent}</strong>
                <span>${languageData.ui.eventNoEffect}</span>
            </div>
        `;
    }

    const eventLanguage =
        languageData.events[
            gameState.world.currentEvent.eventId
        ];

    return `
        <div class="event-card-mini">
            <strong>${eventLanguage.title}</strong>
            <span>${eventLanguage.description}</span>
        </div>
    `;
}

function renderActiveNpcArea() {
    return `
        <aside class="active-npc-area">
            <h3>${languageData.ui.activeNpc}</h3>
            <p>${languageData.ui.activeNpcHint}</p>
            <div class="npc-card-row">
                ${renderNpcMiniCard(npcData.npcA)}
                ${renderNpcMiniCard(npcData.npcB)}
            </div>
        </aside>
    `;
}

function renderNpcMiniCard(npc) {
    const text = languageData.npc[npc.languageId];

    return `
        <button
            class="npc-mini-card interactive"
            type="button"
            data-npc-id="${npc.id}">
            <div class="npc-portrait-mini">
                ${languageData.ui.prototypeArt}
            </div>
            <strong>${text.name}</strong>
            <span>${getLifeStageName(npc.lifeStage)}</span>
            <span>${text.role}</span>
        </button>
    `;
}

function renderPlayerAreas() {
    return gameState.players
        .map(function (player, index) {
            const seatClass = getSeatClass(index);
            return renderPlayerArea(player, seatClass);
        })
        .join("");
}

function getSeatClass(playerIndex) {
    const count = gameState.playerCount;
    const offset =
        (playerIndex - gameState.viewingPlayerIndex + count) %
        count;

    if (offset === 0) {
        return "self-seat";
    }

    const maps = {
        2: {
            1: "top-seat"
        },
        3: {
            1: "top-left-seat",
            2: "top-right-seat"
        },
        4: {
            1: "left-seat",
            2: "top-seat",
            3: "right-seat"
        },
        5: {
            1: "left-seat",
            2: "top-left-seat",
            3: "top-right-seat",
            4: "right-seat"
        }
    };

    return maps[count][offset] || "top-seat";
}

function renderPlayerArea(player, seatClass) {
    return `
        <section
            class="player-area ${seatClass}"
            data-player-area-id="${player.id}">

            <button
                class="player-avatar-button family-color-${player.colorIndex} interactive"
                type="button"
                data-player-avatar-id="${player.id}">
                ${getText(
                    languageData.family.crestShort,
                    { number: player.colorIndex + 1 }
                )}
            </button>

            <div class="player-board-cluster">
                ${renderFamilyBoardOnTable(player)}
                ${renderGenealogyBoardOnTable(player)}
            </div>
        </section>
    `;
}

function renderFamilyBoardOnTable(player) {
    const templateText =
        languageData.familyTemplates[player.templateId];

    return `
        <button
            class="table-family-board interactive"
            type="button"
            data-family-board-id="${player.id}">
            <div class="board-mini-header">
                <strong>
                    ${getText(
                        languageData.family.boardTitle,
                        { family: player.name }
                    )}
                </strong>
                <span class="board-mini-hint">
                    ${languageData.ui.clickBoardHint}
                </span>
            </div>

            <div class="family-board-mini-grid">
                <div class="mini-printed-box">
                    <strong>${languageData.ui.influenceTrack}</strong>
                    ${renderInfluenceTrack(player, "mini")}
                </div>

                <div class="mini-printed-box">
                    <strong>${languageData.ui.actionTokens}</strong>
                    ${renderActionTokens(player, "mini")}
                </div>

                <div class="mini-printed-box">
                    <strong>${languageData.ui.familyAbility}</strong>
                    ${templateText.abilityName}
                </div>

                <div class="mini-printed-box">
                    <strong>${languageData.ui.relationships}</strong>
                    <div class="relation-mini-track">
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>
                </div>

                <div class="mini-printed-box" style="grid-column: 1 / -1;">
                    <strong>${languageData.ui.industries}</strong>
                    ${renderIndustrySlotsMini(player)}
                </div>
            </div>
        </button>
    `;
}

function renderGenealogyBoardOnTable(player) {
    return `
        <button
            class="table-genealogy-board interactive"
            type="button"
            data-genealogy-board-id="${player.id}">
            <div class="board-mini-header">
                <strong>
                    ${getText(
                        languageData.family.genealogyTitle,
                        { family: player.name }
                    )}
                </strong>
                <span class="board-mini-hint">
                    ${languageData.ui.clickBoardHint}
                </span>
            </div>

            <div class="genealogy-mini-cards">
                ${player.members
                    .map(function (member) {
                        return renderCharacterMiniCard(member);
                    })
                    .join("")}
            </div>
        </button>
    `;
}

function renderCharacterMiniCard(member) {
    return `
        <div class="character-mini-card ${
            member.busyThisTurn ? "busy" : ""
        }">
            <div class="character-mini-portrait">
                ${languageData.ui.prototypeArt}
            </div>
            <strong>${member.name}</strong>
            <span>${getLifeStageName(member.lifeStage)}</span>
            <span>${getOfficeName(member.officeType)}</span>
        </div>
    `;
}

function renderInfluenceTrack(player, size) {
    const current = clamp(
        player.resources.influence,
        0,
        FAMILY_INFLUENCE_TRACK_MAX
    );
    const className =
        size === "flat"
            ? "influence-track-flat"
            : "influence-track-mini";

    const nodes = [];

    for (
        let value = 0;
        value <= FAMILY_INFLUENCE_TRACK_MAX;
        value += 1
    ) {
        nodes.push(`
            <span
                class="influence-node ${
                    value === current ? "current" : ""
                } family-color-${player.colorIndex}"
                title="${value}">
            </span>
        `);
    }

    return `<div class="${className}">${nodes.join("")}</div>`;
}

function renderActionTokens(player, size) {
    const baseTokens = [];

    for (
        let index = 0;
        index < BASE_ACTION_ROUNDS;
        index += 1
    ) {
        baseTokens.push(`
            <span class="action-token ${
                index < player.normalActionsTaken
                    ? "spent"
                    : ""
            }">
                ${index + 1}
            </span>
        `);
    }

    const bonusTotal =
        player.bonusActions + player.bonusActionsTaken;

    for (
        let index = 0;
        index < bonusTotal;
        index += 1
    ) {
        baseTokens.push(`
            <span class="action-token bonus ${
                index < player.bonusActionsTaken
                    ? "spent"
                    : ""
            }">
                +
            </span>
        `);
    }

    return `
        <div class="${
            size === "flat"
                ? "action-token-row-flat"
                : "action-token-row-mini"
        }">
            ${baseTokens.join("")}
        </div>
    `;
}

function renderIndustrySlotsMini(player) {
    const slots = [];

    for (
        let index = 0;
        index < player.industryCapacity;
        index += 1
    ) {
        const instance = player.industries[index];

        slots.push(`
            <span class="industry-slot-mini ${
                instance ? "filled" : ""
            }">
                ${
                    instance
                        ? languageData.industries[
                            instance.industryId
                        ].name
                        : ""
                }
            </span>
        `);
    }

    return `
        <div class="industry-slot-row-mini">
            ${slots.join("")}
        </div>
    `;
}

function renderHandDrawer() {
    const player = getViewingPlayer();
    const cards = player.hand
        .map(function (cardId) {
            return `
                <button
                    class="hand-card-button"
                    type="button"
                    data-hand-card-id="${cardId}">
                    ${renderPhysicalCard(cardId, false)}
                </button>
            `;
        })
        .join("");

    return `
        <aside class="hand-drawer ${
            gameState.ui.handCollapsed ? "collapsed" : ""
        }">
            <div class="hand-drawer-inner">
                <button
                    id="hand-toggle-button"
                    class="hand-drawer-toggle"
                    type="button">
                    ${
                        gameState.ui.handCollapsed
                            ? languageData.ui.handExpand
                            : languageData.ui.handCollapse
                    }
                </button>

                <section class="hand-private-vault">
                    <h3>${languageData.ui.privateVault}</h3>
                    <span>${languageData.ui.privateOnly}</span>
                    <div class="private-resource-grid">
                        ${PRIVATE_RESOURCE_KEYS
                            .map(function (key) {
                                return `
                                    <div class="private-resource-chip">
                                        ${getResourceName(key)}
                                        <strong>
                                            ${formatResourceValue(
                                                player.resources[key]
                                            )}
                                        </strong>
                                    </div>
                                `;
                            })
                            .join("")}
                    </div>
                </section>

                <section class="hand-zone">
                    <h3 class="hand-title">
                        ${languageData.ui.hand}
                    </h3>
                    <div class="hand-fan">
                        ${
                            cards ||
                            `<span class="hand-empty">${languageData.ui.handEmpty}</span>`
                        }
                    </div>
                </section>
            </div>
        </aside>
    `;
}

function renderPhysicalCard(cardId, large) {
    const text = languageData.cards[cardId];
    const data = cardData[cardId];

    return `
        <article class="${
            large
                ? "print-card-large"
                : "physical-card-front"
        }">
            <div class="card-type-ribbon">
                ${text.type}
            </div>
            <div class="card-title-block">
                <strong>${text.name}</strong>
                <span>${text.subtitle}</span>
            </div>
            <div class="card-art-placeholder">
                ${languageData.ui.prototypeArt}
            </div>
            <div class="card-bottom-text">
                <strong>
                    ${languageData.ui.cardTiming}：${text.timing}
                </strong>
                <div>${text.text}</div>
                ${
                    data.discardAfterUse
                        ? `<div>${languageData.ui.cardDiscard}</div>`
                        : ""
                }
            </div>
        </article>
    `;
}

function bindGameTableEvents() {
    document
        .getElementById("viewing-player-select")
        .addEventListener("change", function (event) {
            gameState.viewingPlayerIndex = Number(
                event.target.value
            );
            renderGameTable();
        });

    document
        .getElementById("restart-game-button")
        .addEventListener("click", function () {
            startGame(gameState.playerCount);
        });

    document
        .getElementById("hand-toggle-button")
        .addEventListener("click", function () {
            gameState.ui.handCollapsed =
                !gameState.ui.handCollapsed;
            renderGameTable();
        });

    document
        .getElementById("pass-action-button")
        .addEventListener("click", completeAction);

    document
        .getElementById("task-deck-stack")
        .addEventListener("click", showTopTaskCard);

    document
        .getElementById("public-space-a")
        .addEventListener("click", showPublicSpaceAction);

    document
        .querySelectorAll("[data-family-board-id]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                showFamilyBoard(button.dataset.familyBoardId);
            });
        });

    document
        .querySelectorAll("[data-genealogy-board-id]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                showGenealogyBoard(
                    button.dataset.genealogyBoardId
                );
            });
        });

    document
        .querySelectorAll("[data-player-avatar-id]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                showPublicFamilyOverview(
                    button.dataset.playerAvatarId
                );
            });
        });

    document
        .querySelectorAll("[data-office-player-id]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                showCharacterDetails(
                    button.dataset.officePlayerId,
                    button.dataset.officeMemberId
                );
            });
        });

    document
        .querySelectorAll("[data-npc-id]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                showNpcDetails(button.dataset.npcId);
            });
        });

    document
        .querySelectorAll("[data-hand-card-id]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                showHandCardDetails(
                    button.dataset.handCardId
                );
            });
        });

    document
        .querySelectorAll("[data-industry-instance-id]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                showIndustryDetails(
                    button.dataset.industryInstanceId,
                    "supply"
                );
            });
        });

    bindCameraEvents();
}

function bindCameraEvents() {
    const viewport = document.getElementById("table-viewport");
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    viewport.addEventListener(
        "wheel",
        function (event) {
            event.preventDefault();
            zoomCameraAtPointer(event);
        },
        { passive: false }
    );

    viewport.addEventListener("pointerdown", function (event) {
        if (
            event.button !== 0 ||
            event.target.closest(
                "button, select, .interactive"
            )
        ) {
            return;
        }

        dragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
        viewport.classList.add("dragging");
        viewport.setPointerCapture(event.pointerId);
    });

    viewport.addEventListener("pointermove", function (event) {
        if (!dragging) {
            return;
        }

        gameState.camera.panX += event.clientX - lastX;
        gameState.camera.panY += event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;
        applyCameraTransform();
    });

    viewport.addEventListener("pointerup", function (event) {
        if (!dragging) {
            return;
        }

        dragging = false;
        viewport.classList.remove("dragging");

        if (viewport.hasPointerCapture(event.pointerId)) {
            viewport.releasePointerCapture(event.pointerId);
        }
    });

    viewport.addEventListener("pointercancel", function () {
        dragging = false;
        viewport.classList.remove("dragging");
    });
}

function zoomCameraAtPointer(event) {
    const viewport = document.getElementById("table-viewport");
    const rect = viewport.getBoundingClientRect();
    const pointerX =
        event.clientX - rect.left - rect.width / 2;
    const pointerY =
        event.clientY - rect.top - rect.height / 2;
    const oldScale = gameState.camera.scale;
    const zoomFactor = Math.exp(
        -event.deltaY * CAMERA_WHEEL_SENSITIVITY
    );
    const newScale = clamp(
        oldScale * zoomFactor,
        CAMERA_MIN_SCALE,
        CAMERA_MAX_SCALE
    );

    if (newScale === oldScale) {
        return;
    }

    const worldX =
        (pointerX - gameState.camera.panX) / oldScale;
    const worldY =
        (pointerY - gameState.camera.panY) / oldScale;

    gameState.camera.panX = pointerX - worldX * newScale;
    gameState.camera.panY = pointerY - worldY * newScale;
    gameState.camera.scale = newScale;

    applyCameraTransform();
}

function panCamera(deltaX, deltaY) {
    gameState.camera.panX += deltaX;
    gameState.camera.panY += deltaY;
    applyCameraTransform();
}

function applyCameraTransform() {
    const world = document.getElementById("camera-world");

    if (!world) {
        return;
    }

    world.style.transform = `
        translate(-50%, -50%)
        translate(${gameState.camera.panX}px, ${gameState.camera.panY}px)
        scale(${gameState.camera.scale})
    `;
}

function showModal(content, options = {}) {
    const overlay = document.getElementById("modal-overlay");
    const panel = document.getElementById("modal-panel");
    const classes = ["modal-panel"];

    if (options.narrow) {
        classes.push("narrow");
    }

    if (options.board) {
        classes.push("board-modal");
    }

    if (options.card) {
        classes.push("card-modal");
    }

    panel.className = classes.join(" ");
    panel.innerHTML = content;
    overlay.hidden = false;
    gameState.ui.modalLocked = Boolean(options.locked);

    overlay.onclick = function (event) {
        if (
            event.target === overlay &&
            !gameState.ui.modalLocked
        ) {
            closeModal();
        }
    };
}

function closeModal() {
    const overlay = document.getElementById("modal-overlay");
    const panel = document.getElementById("modal-panel");

    if (!overlay || gameState.ui.modalLocked) {
        return;
    }

    overlay.hidden = true;
    panel.innerHTML = "";
}

function forceCloseModal() {
    const overlay = document.getElementById("modal-overlay");
    const panel = document.getElementById("modal-panel");

    if (!overlay) {
        return;
    }

    gameState.ui.modalLocked = false;
    overlay.hidden = true;
    panel.innerHTML = "";
}

function showFamilyBoard(playerId) {
    const player = getPlayerById(playerId);
    const template = languageData.familyTemplates[player.templateId];

    showModal(`
        <section class="flat-family-board">
            <header class="flat-board-header">
                <div class="flat-crest family-color-${player.colorIndex}">
                    ${getText(
                        languageData.family.crestShort,
                        { number: player.colorIndex + 1 }
                    )}
                </div>
                <div>
                    <h2>
                        ${getText(
                            languageData.family.boardTitle,
                            { family: player.name }
                        )}
                    </h2>
                    <p>${template.startingIndustryRule}</p>
                </div>
            </header>

            <div class="flat-family-grid">
                <section class="printed-section influence-section">
                    <h3>${languageData.ui.influenceTrack}</h3>
                    ${renderInfluenceTrack(player, "flat")}
                </section>

                <section class="printed-section">
                    <h3>${languageData.ui.familyAbility}</h3>
                    <p><strong>${template.abilityName}</strong></p>
                    <p>${template.abilityText}</p>
                    <p>
                        <strong>${languageData.ui.industryStartingRule}</strong><br>
                        ${template.startingIndustryRule}
                    </p>
                </section>

                <section class="printed-section">
                    <h3>${languageData.ui.actionTokens}</h3>
                    ${renderActionTokens(player, "flat")}
                </section>

                <section class="printed-section">
                    <h3>${languageData.ui.relationships}</h3>
                    ${renderRelationshipPrintedSlots(player)}
                </section>

                <section class="printed-section">
                    <h3>${languageData.ui.industries}</h3>
                    <p>
                        ${getText(
                            languageData.ui.industryCapacity,
                            { count: player.industryCapacity }
                        )}
                    </p>
                    ${renderIndustrySlotsFlat(player)}
                </section>
            </div>
        </section>
    `, { board: true });

    bindIndustryOwnedButtons();
}

function renderRelationshipPrintedSlots(player) {
    if (player.relationships.length === 0) {
        return `
            <div class="relationship-printed-slot">
                <div>
                    <strong>${languageData.ui.relationshipEmpty}</strong>
                    <div class="relationship-five-track">
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>
                </div>
                <div class="relationship-rule-icons">
                    <span>${languageData.ui.relationshipBenefit}</span>
                    <span>${languageData.ui.relationshipBreakCost}</span>
                </div>
            </div>
            <div class="relationship-printed-slot">
                <div>
                    <div class="relationship-five-track">
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>
                </div>
                <div class="relationship-rule-icons">
                    <span>${languageData.ui.relationshipBenefit}</span>
                    <span>${languageData.ui.relationshipBreakCost}</span>
                </div>
            </div>
        `;
    }

    return player.relationships
        .map(function (relationship) {
            const track = [];
            for (let index = 1; index <= 5; index += 1) {
                track.push(`<span></span>`);
            }
            return `
                <div class="relationship-printed-slot">
                    <div>
                        <strong>${relationship.label}</strong>
                        <div class="relationship-five-track">
                            ${track.join("")}
                        </div>
                    </div>
                    <div class="relationship-rule-icons">
                        <span>${languageData.ui.relationshipBenefit}</span>
                        <span>${languageData.ui.relationshipBreakCost}</span>
                    </div>
                </div>
            `;
        })
        .join("");
}

function renderIndustrySlotsFlat(player) {
    const slots = [];

    for (
        let index = 0;
        index < player.industryCapacity;
        index += 1
    ) {
        const instance = player.industries[index];

        slots.push(`
            <button
                class="industry-slot-flat ${
                    instance ? "filled interactive" : ""
                }"
                type="button"
                ${
                    instance
                        ? `data-owned-industry-instance-id="${instance.instanceId}"`
                        : "disabled"
                }>
                ${
                    instance
                        ? languageData.industries[
                            instance.industryId
                        ].name
                        : languageData.ui.emptySlot
                }
            </button>
        `);
    }

    return `
        <div class="industry-slots-flat">
            ${slots.join("")}
        </div>
    `;
}

function bindIndustryOwnedButtons() {
    document
        .querySelectorAll("[data-owned-industry-instance-id]")
        .forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.stopPropagation();
                const player = getPlayerByIndustryInstance(
                    button.dataset.ownedIndustryInstanceId
                );

                if (!player) {
                    return;
                }

                showIndustryDetails(
                    button.dataset.ownedIndustryInstanceId,
                    "owned",
                    player.id
                );
            });
        });
}

function showGenealogyBoard(playerId) {
    const player = getPlayerById(playerId);

    showModal(`
        <section class="flat-genealogy-board">
            <h2>
                ${getText(
                    languageData.family.genealogyTitle,
                    { family: player.name }
                )}
            </h2>
            <div class="genealogy-flat-row">
                ${player.members
                    .map(function (member) {
                        return renderCharacterFlatCard(
                            player,
                            member,
                            true
                        );
                    })
                    .join("")}
            </div>
        </section>
    `, { board: true });

    document
        .querySelectorAll("[data-flat-character-id]")
        .forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.stopPropagation();
                showCharacterDetails(
                    player.id,
                    button.dataset.flatCharacterId
                );
            });
        });
}

function renderCharacterFlatCard(player, member, clickable) {
    return `
        <article
            class="character-card-flat ${
                member.busyThisTurn ? "busy" : ""
            } ${clickable ? "interactive" : ""}"
            ${
                clickable
                    ? `data-flat-character-id="${member.id}"`
                    : ""
            }>
            <div class="character-portrait-flat">
                ${languageData.ui.prototypeArt}
            </div>
            <h3>${member.name}</h3>
            <p>${getLifeStageName(member.lifeStage)}</p>
            <p>
                ${languageData.ui.office}：
                ${getOfficeName(member.officeType)}
            </p>
            <p>
                ${languageData.ui.currentStates}：
                ${formatStates(member.states)}
            </p>
            ${
                member.busyThisTurn
                    ? `<p><strong>${languageData.ui.characterBusy}</strong></p>`
                    : ""
            }
        </article>
    `;
}

function showPublicFamilyOverview(playerId) {
    const player = getPlayerById(playerId);
    const template = languageData.familyTemplates[player.templateId];

    showModal(`
        <section class="public-family-modal modal-content-surface">
            <header class="public-family-header">
                <div class="flat-crest family-color-${player.colorIndex}">
                    ${getText(
                        languageData.family.crestShort,
                        { number: player.colorIndex + 1 }
                    )}
                </div>
                <div>
                    <h2>${player.name}</h2>
                    <p>${template.abilityName}</p>
                </div>
            </header>

            <div class="public-family-grid">
                <section class="public-family-section">
                    <h3>${languageData.ui.influenceTrack}</h3>
                    ${renderInfluenceTrack(player, "flat")}
                </section>

                <section class="public-family-section">
                    <h3>${languageData.ui.industries}</h3>
                    ${
                        player.industries.length > 0
                            ? player.industries
                                .map(function (instance) {
                                    return `
                                        <div class="public-member-row">
                                            ${languageData.industries[
                                                instance.industryId
                                            ].name}
                                        </div>
                                    `;
                                })
                                .join("")
                            : languageData.ui.noIndustry
                    }
                </section>

                <section class="public-family-section" style="grid-column: 1 / -1;">
                    <h3>${languageData.ui.publicMemberStatus}</h3>
                    <div class="public-member-list">
                        ${player.members
                            .map(function (member) {
                                return `
                                    <div class="public-member-row">
                                        <strong>${member.name}</strong>・
                                        ${getLifeStageName(member.lifeStage)}・
                                        ${getOfficeName(member.officeType)}・
                                        ${formatStates(member.states)}
                                    </div>
                                `;
                            })
                            .join("")}
                    </div>
                </section>
            </div>
        </section>
    `, { narrow: true });
}

function showCharacterDetails(playerId, memberId) {
    const player = getPlayerById(playerId);
    const member = getMemberById(player, memberId);

    if (!member) {
        return;
    }

    showModal(`
        <section class="modal-content-surface">
            <div class="card-detail-layout">
                ${renderCharacterFlatCard(player, member, false)}
                <div class="card-detail-side">
                    <h2>${player.name}・${member.name}</h2>
                    <div class="info-row">
                        <span>${languageData.ui.lifeStage}</span>
                        <strong>${getLifeStageName(member.lifeStage)}</strong>
                    </div>
                    <div class="info-row">
                        <span>${languageData.ui.office}</span>
                        <strong>${getOfficeName(member.officeType)}</strong>
                    </div>
                    <div class="info-row">
                        <span>${languageData.ui.currentStates}</span>
                        <strong>${formatStates(member.states)}</strong>
                    </div>
                    <h3>${languageData.ui.abilities}</h3>
                    ${Object.keys(member.abilities)
                        .map(function (key) {
                            return `
                                <div class="info-row">
                                    <span>${getAbilityName(key)}</span>
                                    <strong>${member.abilities[key]}</strong>
                                </div>
                            `;
                        })
                        .join("")}
                </div>
            </div>
        </section>
    `, { card: true });
}

function showNpcDetails(npcId) {
    const npc = npcData[npcId];
    const text = languageData.npc[npc.languageId];

    showModal(`
        <section class="modal-content-surface">
            <div class="card-detail-layout">
                <article class="character-card-flat">
                    <div class="character-portrait-flat">
                        ${languageData.ui.prototypeArt}
                    </div>
                    <h3>${text.name}</h3>
                    <p>${getLifeStageName(npc.lifeStage)}</p>
                    <p>${text.role}</p>
                    <p>
                        ${languageData.ui.office}：
                        ${getOfficeName(npc.officeType)}
                    </p>
                </article>

                <div class="card-detail-side">
                    <h2>${text.name}</h2>
                    <div class="info-row">
                        <span>${languageData.ui.currentStates}</span>
                        <strong>${formatStates(npc.states)}</strong>
                    </div>
                    <h3>${languageData.ui.abilities}</h3>
                    ${Object.keys(npc.abilities)
                        .map(function (key) {
                            return `
                                <div class="info-row">
                                    <span>${getAbilityName(key)}</span>
                                    <strong>${npc.abilities[key]}</strong>
                                </div>
                            `;
                        })
                        .join("")}
                </div>
            </div>
        </section>
    `, { card: true });
}

function showHandCardDetails(cardId) {
    const player = getViewingPlayer();
    const canUse = canPlayCardNow(player, cardId);
    const text = languageData.cards[cardId];

    showModal(`
        <div class="card-detail-layout">
            ${renderPhysicalCard(cardId, true)}

            <section class="card-detail-side">
                <h2>${text.name}</h2>
                <div class="info-row">
                    <span>${languageData.ui.cardType}</span>
                    <strong>${text.type}</strong>
                </div>
                <div class="info-row">
                    <span>${languageData.ui.cardTiming}</span>
                    <strong>${text.timing}</strong>
                </div>
                <div class="info-row">
                    <span>${languageData.ui.cardEffect}</span>
                    <strong>${text.text}</strong>
                </div>
                <p>${text.flavor}</p>

                <div class="modal-actions">
                    <button
                        id="use-hand-card-button"
                        class="primary-button"
                        type="button"
                        ${canUse ? "" : "disabled"}>
                        ${languageData.ui.useCard}
                    </button>
                </div>

                ${
                    canUse
                        ? ""
                        : `<p>${languageData.ui.unavailableTiming}</p>`
                }
            </section>
        </div>
    `, { card: true });

    const useButton = document.getElementById(
        "use-hand-card-button"
    );

    if (useButton && !useButton.disabled) {
        useButton.addEventListener("click", function () {
            playFreeTurnCard(player, cardId);
        });
    }
}

function canPlayCardNow(player, cardId) {
    const card = cardData[cardId];

    if (!card || !player.hand.includes(cardId)) {
        return false;
    }

    if (card.timing === "ownTurnFree") {
        return (
            !gameState.actionInProgress &&
            isViewingActivePlayer() &&
            player.id === getActivePlayer().id &&
            gameState.phase === "actionRounds"
        );
    }

    if (card.timing === "beforeTaskRoll") {
        return (
            gameState.currentTask &&
            gameState.currentTask.stage === "pre" &&
            gameState.currentTask.performerPlayerId ===
                player.id
        );
    }

    return false;
}

function playFreeTurnCard(player, cardId) {
    const card = cardData[cardId];

    if (!canPlayCardNow(player, cardId)) {
        return;
    }

    if (card.effect === "bonusAction") {
        player.bonusActions += card.value;
    }

    discardCard(player, cardId);
    forceCloseModal();
    renderGameTable();
}

function showIndustryDetails(
    instanceId,
    source,
    ownerPlayerId = null
) {
    let instance = null;

    if (source === "supply") {
        instance = gameState.world.industrySupply.find(
            function (candidate) {
                return candidate.instanceId === instanceId;
            }
        );
    } else if (ownerPlayerId) {
        const owner = getPlayerById(ownerPlayerId);
        instance = owner.industries.find(function (candidate) {
            return candidate.instanceId === instanceId;
        });
    }

    if (!instance) {
        return;
    }

    const data = industryData[instance.industryId];
    const text = languageData.industries[instance.industryId];
    const activePlayer = getActivePlayer();
    const canGain =
        source === "supply" &&
        canViewerTakeActiveAction() &&
        activePlayer.industries.length <
            activePlayer.industryCapacity;

    showModal(`
        <div class="card-detail-layout">
            <article class="industry-tile-large">
                <h2>${text.name}</h2>
                <p class="industry-type">
                    ${languageData.industries.types[data.type]}
                </p>
                <div class="industry-art-placeholder">
                    ${languageData.ui.prototypeArt}
                </div>
                <p class="industry-effect">${text.text}</p>
                <p>${text.flavor}</p>
            </article>

            <section class="card-detail-side">
                <h2>${languageData.ui.industries}</h2>
                <p>${languageData.ui.industrySupplyHint}</p>
                ${
                    source === "supply"
                        ? `<p>${languageData.ui.industryPrototypeAction}</p>`
                        : ""
                }

                ${
                    source === "supply"
                        ? `
                            <div class="modal-actions">
                                <button
                                    id="gain-industry-button"
                                    class="primary-button"
                                    type="button"
                                    ${canGain ? "" : "disabled"}>
                                    ${languageData.ui.gainIndustry}
                                </button>
                            </div>
                        `
                        : ""
                }

                ${
                    source === "supply" &&
                    activePlayer.industries.length >=
                        activePlayer.industryCapacity
                        ? `<p>${languageData.ui.industryFull}</p>`
                        : ""
                }
            </section>
        </div>
    `, { card: true });

    const gainButton = document.getElementById(
        "gain-industry-button"
    );

    if (gainButton && !gainButton.disabled) {
        gainButton.addEventListener("click", function () {
            gainIndustryFromSupply(instanceId);
        });
    }
}

function gainIndustryFromSupply(instanceId) {
    if (!canViewerTakeActiveAction()) {
        return;
    }

    const player = getActivePlayer();

    if (
        player.industries.length >=
        player.industryCapacity
    ) {
        return;
    }

    const supplyIndex =
        gameState.world.industrySupply.findIndex(
            function (instance) {
                return instance.instanceId === instanceId;
            }
        );

    if (supplyIndex < 0) {
        return;
    }

    const instance =
        gameState.world.industrySupply.splice(
            supplyIndex,
            1
        )[0];

    player.industries.push(instance);
    refillIndustrySupply();
    forceCloseModal();
    completeAction();
}

function showPublicSpaceAction() {
    if (!canViewerTakeActiveAction()) {
        showModal(`
            <section class="modal-content-surface">
                <h2>${languageData.ui.publicSpacePrototype}</h2>
                <p>${languageData.ui.publicSpaceEffect}</p>
                <p>${languageData.ui.activeFamilyOnly}</p>
            </section>
        `, { narrow: true });
        return;
    }

    const player = getActivePlayer();
    const eligible = player.members.filter(function (member) {
        return (
            ["adult", "prime", "old"].includes(
                member.lifeStage
            ) &&
            !member.busyThisTurn
        );
    });

    showModal(`
        <section class="modal-content-surface">
            <h2>${languageData.ui.publicSpacePrototype}</h2>
            <p>${languageData.ui.publicSpaceEffect}</p>
            <h3>${languageData.ui.chooseCharacter}</h3>

            <div class="character-choice-grid">
                ${
                    eligible.length > 0
                        ? eligible
                            .map(function (member) {
                                return `
                                    <button
                                        class="character-choice"
                                        type="button"
                                        data-public-member-id="${member.id}">
                                        <strong>${member.name}</strong>
                                        <span>${getLifeStageName(member.lifeStage)}</span>
                                        <span>${getOfficeName(member.officeType)}</span>
                                    </button>
                                `;
                            })
                            .join("")
                        : languageData.ui.noEligibleCharacter
                }
            </div>
        </section>
    `, { narrow: true });

    document
        .querySelectorAll("[data-public-member-id]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                executePublicSpaceAction(
                    button.dataset.publicMemberId
                );
            });
        });
}

function executePublicSpaceAction(memberId) {
    if (!canViewerTakeActiveAction()) {
        return;
    }

    const player = getActivePlayer();
    const member = getMemberById(player, memberId);

    if (!member || member.busyThisTurn) {
        return;
    }

    member.busyThisTurn = true;
    player.resources.influence += 1;

    gameState.world.publicSpaces.publicSpaceA.occupants.push({
        playerId: player.id,
        memberId: member.id
    });

    forceCloseModal();
    completeAction();
}

function showTopTaskCard() {
    const taskInstance = gameState.world.taskDeck[0];

    if (!taskInstance) {
        showModal(`
            <section class="modal-content-surface">
                <h2>${languageData.ui.taskDeck}</h2>
                <p>${languageData.ui.taskDeckEmpty}</p>
            </section>
        `, { narrow: true });
        return;
    }

    const taskLanguage =
        languageData.tasks[taskInstance.taskId];
    const task = taskData[taskInstance.taskId];
    const activePlayer = getActivePlayer();
    const qualified = getQualifiedTaskPerformers(
        activePlayer,
        task
    );
    const canExecute =
        canViewerTakeActiveAction() &&
        qualified.length > 0;

    showModal(`
        <div class="card-detail-layout">
            ${renderTaskPhysicalCard(taskInstance.taskId)}

            <section class="card-detail-side">
                <h2>${taskLanguage.name}</h2>
                <p>${languageData.ui.taskRequirementPrototype}</p>
                <div class="info-row">
                    <span>${languageData.ui.office}</span>
                    <strong>${taskLanguage.suitableOffice}</strong>
                </div>
                <div class="info-row">
                    <span>${languageData.ui.abilities}</span>
                    <strong>${taskLanguage.ability}</strong>
                </div>

                ${
                    qualified.length === 0
                        ? `<p>${languageData.ui.taskNotQualified}</p>`
                        : ""
                }

                <div class="modal-actions">
                    <button
                        id="decline-task-button"
                        class="secondary-button"
                        type="button">
                        ${languageData.ui.declineTask}
                    </button>
                    <button
                        id="execute-task-button"
                        class="primary-button"
                        type="button"
                        ${canExecute ? "" : "disabled"}>
                        ${languageData.ui.executeTask}
                    </button>
                </div>
            </section>
        </div>
    `, { card: true });

    document
        .getElementById("decline-task-button")
        .addEventListener("click", forceCloseModal);

    const executeButton = document.getElementById(
        "execute-task-button"
    );

    if (executeButton && !executeButton.disabled) {
        executeButton.addEventListener("click", function () {
            chooseTaskPerformer(
                taskInstance,
                qualified
            );
        });
    }
}

function renderTaskPhysicalCard(taskId) {
    const text = languageData.tasks[taskId];
    const task = taskData[taskId];

    return `
        <article class="task-card-large">
            <div class="task-type">${text.type}</div>
            <h2>${text.title}</h2>
            <h3>${text.name}</h3>
            <div class="task-card-art">
                ${languageData.ui.prototypeArt}
            </div>
            <p class="task-card-text">${text.description}</p>
            <div class="task-meta-grid">
                <span>${text.suitableOffice}</span>
                <span>${text.ability}</span>
            </div>
            ${renderTaskOutcomeMatrix(task.ability)}
        </article>
    `;
}

function renderTaskOutcomeMatrix() {
    const rows = [];

    for (let ability = 1; ability <= 5; ability += 1) {
        const cells = [];

        for (let roll = 1; roll <= 6; roll += 1) {
            const result = getAbilityResult(ability, roll);
            cells.push(`${roll}${languageData.ui.taskOutcomeSymbols[result]}`);
        }

        rows.push(
            `${ability}：${cells.join("　")}`
        );
    }

    return `
        <div class="task-result-guide">
            ${rows.join("<br>")}
        </div>
    `;
}

function getQualifiedTaskPerformers(player, task) {
    return player.members.filter(function (member) {
        return member.officeType === task.requiredOffice;
    });
}

function chooseTaskPerformer(taskInstance, performers) {
    showModal(`
        <section class="modal-content-surface">
            <h2>${languageData.ui.chooseCharacter}</h2>
            <div class="character-choice-grid">
                ${performers
                    .map(function (member) {
                        return `
                            <button
                                class="character-choice"
                                type="button"
                                data-task-performer-id="${member.id}">
                                <strong>${member.name}</strong>
                                <span>${getLifeStageName(member.lifeStage)}</span>
                                <span>${getOfficeName(member.officeType)}</span>
                            </button>
                        `;
                    })
                    .join("")}
            </div>
        </section>
    `, { narrow: true });

    document
        .querySelectorAll("[data-task-performer-id]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                startTaskResolution(
                    taskInstance,
                    button.dataset.taskPerformerId
                );
            });
        });
}

function startTaskResolution(taskInstance, performerId) {
    const player = getActivePlayer();

    gameState.actionInProgress = true;
    gameState.currentTask = {
        instanceId: taskInstance.instanceId,
        taskId: taskInstance.taskId,
        performerPlayerId: player.id,
        performerId: performerId,
        stage: "pre",
        abilityModifier: 0,
        preCardsUsed: [],
        preResourceUsed: false,
        postResourceUsed: false,
        originalRoll: null,
        originalResult: null,
        finalRoll: null,
        finalResult: null,
        resultApplied: false
    };

    renderTaskPreWindow();
}

function renderTaskPreWindow() {
    const currentTask = gameState.currentTask;
    const task = taskData[currentTask.taskId];
    const text = languageData.tasks[currentTask.taskId];
    const player = getPlayerById(
        currentTask.performerPlayerId
    );
    const performer = getMemberById(
        player,
        currentTask.performerId
    );
    const preIntervention = task.interventions.preAction;
    const resourceName = getResourceName(
        preIntervention.resource
    );
    const canAfford =
        typeof player.resources[preIntervention.resource] ===
            "number" &&
        player.resources[preIntervention.resource] >=
            preIntervention.cost;
    const hasOldFriend =
        player.hand.includes("oldFriend") &&
        !currentTask.preCardsUsed.includes("oldFriend");

    showModal(`
        <section class="task-resolution-box">
            <h2>${text.title}・${languageData.ui.preTaskWindow}</h2>
            <p>${languageData.ui.preTaskWindowHint}</p>

            <div class="info-row">
                <span>${languageData.ui.taskPerformer}</span>
                <strong>${performer.name}</strong>
            </div>
            <div class="info-row">
                <span>${text.ability}</span>
                <strong>
                    ${performer.abilities[task.ability]}
                    ${
                        currentTask.abilityModifier > 0
                            ? ` + ${currentTask.abilityModifier}`
                            : ""
                    }
                </strong>
            </div>

            ${
                hasOldFriend
                    ? `
                        <div class="intervention-box">
                            <h3>${languageData.cards.oldFriend.name}</h3>
                            <p>${languageData.cards.oldFriend.text}</p>
                            <button
                                id="use-old-friend-button"
                                class="secondary-button"
                                type="button">
                                ${languageData.ui.useCard}
                            </button>
                        </div>
                    `
                    : ""
            }

            ${
                preIntervention.available &&
                !currentTask.preResourceUsed
                    ? `
                        <div class="intervention-box">
                            <h3>${text.interventions.preAction.title}</h3>
                            <p>
                                ${getText(
                                    text.interventions.preAction.rule,
                                    {
                                        cost: preIntervention.cost,
                                        resource: resourceName,
                                        diceCount: preIntervention.diceCount
                                    }
                                )}
                            </p>
                            <button
                                id="use-pre-resource-button"
                                class="secondary-button"
                                type="button"
                                ${canAfford ? "" : "disabled"}>
                                ${text.interventions.preAction.buttonText}
                            </button>
                            ${
                                canAfford
                                    ? ""
                                    : `<p>${getText(
                                        languageData.ui.insufficientResource,
                                        { resource: resourceName }
                                    )}</p>`
                            }
                        </div>
                    `
                    : ""
            }

            <div class="modal-actions">
                <button
                    id="roll-task-button"
                    class="primary-button"
                    type="button">
                    ${languageData.ui.directRoll}
                </button>
            </div>
        </section>
    `, { narrow: true, locked: true });

    const oldFriendButton = document.getElementById(
        "use-old-friend-button"
    );

    if (oldFriendButton) {
        oldFriendButton.addEventListener("click", function () {
            useTaskPreCard("oldFriend");
        });
    }

    const preButton = document.getElementById(
        "use-pre-resource-button"
    );

    if (preButton && !preButton.disabled) {
        preButton.addEventListener("click", usePreTaskResource);
    }

    document
        .getElementById("roll-task-button")
        .addEventListener("click", rollCurrentTask);
}

function useTaskPreCard(cardId) {
    const currentTask = gameState.currentTask;
    const player = getPlayerById(
        currentTask.performerPlayerId
    );
    const card = cardData[cardId];

    if (
        !player.hand.includes(cardId) ||
        currentTask.preCardsUsed.includes(cardId)
    ) {
        return;
    }

    if (card.effect === "taskAbilityModifier") {
        currentTask.abilityModifier += card.value;
    }

    currentTask.preCardsUsed.push(cardId);

    if (card.discardAfterUse) {
        discardCard(player, cardId);
    }

    renderTaskPreWindow();
}

function usePreTaskResource() {
    const currentTask = gameState.currentTask;
    const task = taskData[currentTask.taskId];
    const intervention = task.interventions.preAction;
    const player = getPlayerById(
        currentTask.performerPlayerId
    );

    if (
        currentTask.preResourceUsed ||
        typeof player.resources[intervention.resource] !==
            "number" ||
        player.resources[intervention.resource] <
            intervention.cost
    ) {
        return;
    }

    player.resources[intervention.resource] -=
        intervention.cost;
    currentTask.preResourceUsed = true;
    renderTaskPreWindow();
}

function rollCurrentTask() {
    const currentTask = gameState.currentTask;
    const task = taskData[currentTask.taskId];
    const player = getPlayerById(
        currentTask.performerPlayerId
    );
    const performer = getMemberById(
        player,
        currentTask.performerId
    );
    const ability = clamp(
        performer.abilities[task.ability] +
            currentTask.abilityModifier,
        1,
        5
    );
    const diceCount =
        currentTask.preResourceUsed &&
        task.interventions.preAction.effect ===
            "rollKeepHighest"
            ? task.interventions.preAction.diceCount
            : 1;
    const rollData = rollD6(diceCount);
    const result = getAbilityResult(
        ability,
        rollData.highest
    );

    currentTask.stage = "post";
    currentTask.originalRoll = rollData;
    currentTask.originalResult = result;
    currentTask.finalRoll = rollData;
    currentTask.finalResult = result;

    renderTaskPostWindow(ability);
}

function renderTaskPostWindow(ability) {
    const currentTask = gameState.currentTask;
    const task = taskData[currentTask.taskId];
    const text = languageData.tasks[currentTask.taskId];
    const player = getPlayerById(
        currentTask.performerPlayerId
    );
    const intervention = task.interventions.postAction;
    const resourceName = getResourceName(
        intervention.resource
    );
    const canAfford =
        typeof player.resources[intervention.resource] ===
            "number" &&
        player.resources[intervention.resource] >=
            intervention.cost;
    const resultText =
        text.results[currentTask.originalResult];

    showModal(`
        <section class="task-resolution-box">
            <h2>${text.title}・${languageData.ui.postTaskWindow}</h2>
            <p>${languageData.ui.postTaskWindowHint}</p>

            <div class="task-roll-panel">
                <div>
                    ${languageData.ui.currentAbility}：
                    <strong>${ability}</strong>
                </div>
                <div>
                    ${languageData.ui.originalRoll}：
                    <strong>${formatRollData(currentTask.originalRoll)}</strong>
                </div>
                <div class="result-name">${resultText.name}</div>
                <div>
                    ${languageData.ui.result}：${resultText.effect}
                </div>
            </div>

            <div class="intervention-box">
                <h3>${text.interventions.postAction.title}</h3>
                <p>
                    ${getText(
                        text.interventions.postAction.rule,
                        {
                            cost: intervention.cost,
                            resource: resourceName
                        }
                    )}
                </p>
                <div class="modal-actions">
                    <button
                        id="use-post-resource-button"
                        class="secondary-button"
                        type="button"
                        ${canAfford ? "" : "disabled"}>
                        ${text.interventions.postAction.buttonTextByResult[
                            currentTask.originalResult
                        ]}
                    </button>
                    <button
                        id="accept-task-result-button"
                        class="primary-button"
                        type="button">
                        ${languageData.ui.acceptResult}
                    </button>
                </div>
                ${
                    canAfford
                        ? ""
                        : `<p>${getText(
                            languageData.ui.insufficientResource,
                            { resource: resourceName }
                        )}</p>`
                }
            </div>
        </section>
    `, { narrow: true, locked: true });

    const postButton = document.getElementById(
        "use-post-resource-button"
    );

    if (postButton && !postButton.disabled) {
        postButton.addEventListener("click", function () {
            usePostTaskResource(ability);
        });
    }

    document
        .getElementById("accept-task-result-button")
        .addEventListener("click", function () {
            finalizeCurrentTask(false, ability);
        });
}

function usePostTaskResource(ability) {
    const currentTask = gameState.currentTask;
    const task = taskData[currentTask.taskId];
    const intervention = task.interventions.postAction;
    const player = getPlayerById(
        currentTask.performerPlayerId
    );

    if (
        typeof player.resources[intervention.resource] !==
            "number" ||
        player.resources[intervention.resource] <
            intervention.cost
    ) {
        return;
    }

    player.resources[intervention.resource] -=
        intervention.cost;
    currentTask.postResourceUsed = true;

    const rollData = rollD6(1);
    const result = getAbilityResult(
        ability,
        rollData.highest
    );

    currentTask.finalRoll = rollData;
    currentTask.finalResult = result;

    finalizeCurrentTask(true, ability);
}

function finalizeCurrentTask(usedPostIntervention, ability) {
    const currentTask = gameState.currentTask;
    const task = taskData[currentTask.taskId];
    const text = languageData.tasks[currentTask.taskId];
    const player = getPlayerById(
        currentTask.performerPlayerId
    );

    if (!currentTask.resultApplied) {
        applyTaskResult(
            player,
            task.results[currentTask.finalResult]
        );
        currentTask.resultApplied = true;
    }

    const resultText =
        text.results[currentTask.finalResult];
    let narrative = "";

    if (usedPostIntervention) {
        const change = getRerollOutcomeChange(
            currentTask.originalResult,
            currentTask.finalResult
        );

        narrative = getText(
            text.interventions.postAction.rerollNarrative[
                change
            ],
            {
                originalResultName:
                    text.results[
                        currentTask.originalResult
                    ].name,
                newResultName: resultText.name
            }
        );
    }

    showModal(`
        <section class="task-resolution-box">
            <h2>${text.title}・${languageData.ui.taskComplete}</h2>

            <div class="task-roll-panel">
                <div>
                    ${languageData.ui.currentAbility}：
                    <strong>${ability}</strong>
                </div>
                <div>
                    ${languageData.ui.finalRoll}：
                    <strong>${formatRollData(currentTask.finalRoll)}</strong>
                </div>
                <div class="result-name">${resultText.name}</div>
                <div>
                    ${languageData.ui.result}：${resultText.effect}
                </div>
                ${narrative ? `<p>${narrative}</p>` : ""}
            </div>

            <div class="modal-actions center">
                <button
                    id="finish-task-button"
                    class="primary-button"
                    type="button">
                    ${languageData.ui.taskComplete}
                </button>
            </div>
        </section>
    `, { narrow: true, locked: true });

    document
        .getElementById("finish-task-button")
        .addEventListener("click", finishTaskAndAction);
}

function finishTaskAndAction() {
    const currentTask = gameState.currentTask;
    const topTask = gameState.world.taskDeck[0];

    if (
        topTask &&
        topTask.instanceId === currentTask.instanceId
    ) {
        gameState.world.taskDiscard.push(
            gameState.world.taskDeck.shift()
        );
    }

    gameState.currentTask = null;
    gameState.actionInProgress = false;
    forceCloseModal();
    completeAction();
}

function applyTaskResult(player, resultData) {
    const changes = resultData.resourceChanges || {};

    Object.keys(changes).forEach(function (key) {
        if (typeof player.resources[key] !== "number") {
            return;
        }

        player.resources[key] += changes[key];
        player.resources[key] = Math.max(
            0,
            player.resources[key]
        );
    });
}

function canViewerTakeActiveAction() {
    return (
        isViewingActivePlayer() &&
        !gameState.actionInProgress &&
        ["actionRounds", "bonusActions"].includes(
            gameState.phase
        )
    );
}

function isViewingActivePlayer() {
    return (
        gameState.viewingPlayerIndex ===
        gameState.activePlayerIndex
    );
}

function completeAction() {
    if (!canViewerTakeActiveAction()) {
        return;
    }

    const player = getActivePlayer();

    if (gameState.phase === "actionRounds") {
        player.normalActionsTaken += 1;
        advanceNormalActionTurn();
        return;
    }

    if (gameState.phase === "bonusActions") {
        player.bonusActions = Math.max(
            0,
            player.bonusActions - 1
        );
        player.bonusActionsTaken += 1;
        advanceBonusActionTurn();
    }
}

function advanceNormalActionTurn() {
    gameState.activePlayerIndex += 1;

    if (
        gameState.activePlayerIndex >=
        gameState.playerCount
    ) {
        gameState.activePlayerIndex = 0;
        gameState.actionRound += 1;
    }

    if (gameState.actionRound > BASE_ACTION_ROUNDS) {
        beginBonusActionsOrSettlement();
        return;
    }

    gameState.viewingPlayerIndex =
        gameState.activePlayerIndex;
    renderGameTable();
}

function beginBonusActionsOrSettlement() {
    gameState.bonusQueue = [];

    gameState.players.forEach(function (player, index) {
        for (
            let count = 0;
            count < player.bonusActions;
            count += 1
        ) {
            gameState.bonusQueue.push(index);
        }
    });

    if (gameState.bonusQueue.length === 0) {
        showTurnSettlement();
        return;
    }

    gameState.phase = "bonusActions";
    gameState.activePlayerIndex = gameState.bonusQueue[0];
    gameState.viewingPlayerIndex =
        gameState.activePlayerIndex;
    renderGameTable();
}

function advanceBonusActionTurn() {
    gameState.bonusQueue.shift();

    if (gameState.bonusQueue.length === 0) {
        showTurnSettlement();
        return;
    }

    gameState.activePlayerIndex = gameState.bonusQueue[0];
    gameState.viewingPlayerIndex =
        gameState.activePlayerIndex;
    renderGameTable();
}

function showTurnSettlement() {
    gameState.phase = "settlement";
    const summary = applyIndustrySettlement();
    renderGameTable();

    showModal(`
        <section class="modal-content-surface">
            <h2>${languageData.ui.turnSettlement}</h2>
            <p>${languageData.ui.settlementText}</p>

            <div class="settlement-list">
                ${summary
                    .map(function (item) {
                        return `
                            <div class="settlement-family-row">
                                <strong>${item.playerName}</strong><br>
                                ${item.text}
                            </div>
                        `;
                    })
                    .join("")}
            </div>

            <h3>${languageData.ui.timePasses}</h3>
            <p>${languageData.ui.timePassesPrototype}</p>

            <div class="modal-actions">
                <button
                    id="next-turn-button"
                    class="primary-button"
                    type="button">
                    ${languageData.ui.nextTurn}
                </button>
            </div>
        </section>
    `, { narrow: true, locked: true });

    document
        .getElementById("next-turn-button")
        .addEventListener("click", function () {
            gameState.turn += 1;
            beginTurn();
            forceCloseModal();
            renderGameTable();
        });
}

function applyIndustrySettlement() {
    const summary = [];

    gameState.players.forEach(function (player) {
        const gains = {};

        player.industries.forEach(function (instance) {
            const yieldData =
                industryData[instance.industryId].yield;

            Object.keys(yieldData).forEach(function (key) {
                if (typeof player.resources[key] !== "number") {
                    return;
                }

                player.resources[key] += yieldData[key];
                gains[key] =
                    (gains[key] || 0) + yieldData[key];
            });
        });

        const text = Object.keys(gains)
            .map(function (key) {
                return `${getResourceName(key)} +${gains[key]}`;
            })
            .join("、");

        summary.push({
            playerName: player.name,
            text: text || languageData.ui.noIndustry
        });
    });

    return summary;
}

function discardCard(player, cardId) {
    const index = player.hand.indexOf(cardId);

    if (index < 0) {
        return;
    }

    player.hand.splice(index, 1);
    player.discard.push(cardId);
}

function getPlayerById(playerId) {
    return gameState.players.find(function (player) {
        return player.id === playerId;
    });
}

function getPlayerByIndustryInstance(instanceId) {
    return gameState.players.find(function (player) {
        return player.industries.some(function (instance) {
            return instance.instanceId === instanceId;
        });
    });
}

function getMemberById(player, memberId) {
    if (!player) {
        return null;
    }

    return player.members.find(function (member) {
        return member.id === memberId;
    });
}

function getActivePlayer() {
    return gameState.players[gameState.activePlayerIndex];
}

function getViewingPlayer() {
    return gameState.players[gameState.viewingPlayerIndex];
}

function getResourceName(resourceKey) {
    return languageData.resources[resourceKey] || resourceKey;
}

function getAbilityName(abilityKey) {
    return languageData.abilities[abilityKey] || abilityKey;
}

function getLifeStageName(stageKey) {
    return languageData.lifeStages[stageKey] || stageKey;
}

function getOfficeName(officeType) {
    if (!officeType) {
        return languageData.ui.noOffice;
    }

    return languageData.offices[officeType] || officeType;
}

function formatStates(states) {
    if (!states || states.length === 0) {
        return languageData.ui.noStates;
    }

    return states.join("、");
}

function formatResourceValue(value) {
    return typeof value === "number"
        ? value
        : "—";
}

function getRerollOutcomeChange(
    originalResult,
    newResult
) {
    const oldRank = taskResultRank[originalResult];
    const newRank = taskResultRank[newResult];

    if (newRank > oldRank) {
        return "better";
    }

    if (newRank < oldRank) {
        return "worse";
    }

    return "same";
}

function formatRollData(rollData) {
    if (!rollData) {
        return "";
    }

    if (rollData.rolls.length === 1) {
        return String(rollData.highest);
    }

    return `${rollData.rolls.join("、")} → ${rollData.highest}`;
}

function rollD6(diceCount = 1) {
    const rolls = [];

    for (let index = 0; index < diceCount; index += 1) {
        rolls.push(
            Math.floor(Math.random() * 6) + 1
        );
    }

    return {
        rolls: rolls,
        highest: Math.max(...rolls)
    };
}

function getAbilityResult(ability, roll) {
    const table = abilityResultTable[ability];

    if (table.failure.includes(roll)) {
        return "failure";
    }

    if (table.success.includes(roll)) {
        return "success";
    }

    if (table.greatWin.includes(roll)) {
        return "greatWin";
    }

    if (table.greatVictory.includes(roll)) {
        return "greatVictory";
    }

    return null;
}

function shuffleArray(input) {
    const array = [...input];

    for (let index = array.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(
            Math.random() * (index + 1)
        );
        const temp = array[index];
        array[index] = array[swapIndex];
        array[swapIndex] = temp;
    }

    return array;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

window.addEventListener("keydown", function (event) {
    if (
        event.key === "Escape" &&
        !gameState.ui.modalLocked
    ) {
        closeModal();
        return;
    }

    if (!document.getElementById("camera-world")) {
        return;
    }

    const activeTag = document.activeElement
        ? document.activeElement.tagName
        : "";

    if (["INPUT", "TEXTAREA", "SELECT"].includes(activeTag)) {
        return;
    }

    if (event.key === "ArrowUp") {
        event.preventDefault();
        panCamera(0, CAMERA_KEY_PAN_STEP);
    }

    if (event.key === "ArrowDown") {
        event.preventDefault();
        panCamera(0, -CAMERA_KEY_PAN_STEP);
    }

    if (event.key === "ArrowLeft") {
        event.preventDefault();
        panCamera(CAMERA_KEY_PAN_STEP, 0);
    }

    if (event.key === "ArrowRight") {
        event.preventDefault();
        panCamera(-CAMERA_KEY_PAN_STEP, 0);
    }
});

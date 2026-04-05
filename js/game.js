/**
 * Shosen Game Logic
 */

// --- Data ---
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter']; // 0, 1, 2, 3
const SEASON_JP = ['春', '夏', '秋', '冬'];
const PREFERENCES = [
    { id: 'safety', label: '安心', jp: '安心', color: '#4caf50', desc: '定番・実績' },
    { id: 'pleasure', label: '快楽', jp: '快楽', color: '#e91e63', desc: '楽しさ・ワクワク' },
    { id: 'growth', label: '成長', jp: '成長', color: '#2196f3', desc: '学び・進化' },
    { id: 'efficiency', label: '効率', jp: '効率', color: '#ff9800', desc: '時短・合理' }
];

const ROTATION_INTERVAL = 10;

const PRODUCTS = [
    // Safety
    { name: '定番スーツ', type: 'safety', season: 0, power: 1 }, // Spring
    { name: '老舗の和菓子', type: 'safety', season: 2, power: 1 }, // Autumn
    { name: '長期保証家電', type: 'safety', season: 3, power: 1 }, // Winter
    { name: '無添加食品', type: 'safety', season: 1, power: 1 }, // Summer

    // Safety - Power 2
    { name: '究極の安全車', type: 'safety', season: 3, power: 2 }, // Winter

    // Pleasure
    { name: '高級ワイン', type: 'pleasure', season: 2, power: 1 }, // Autumn
    { name: '最新ゲーム', type: 'pleasure', season: 3, power: 1 }, // Winter
    { name: '花火セット', type: 'pleasure', season: 1, power: 1 }, // Summer
    { name: '旅行チケット', type: 'pleasure', season: 0, power: 1 }, // Spring

    // Pleasure - Power 2
    { name: '世界一周旅行', type: 'pleasure', season: 1, power: 2 }, // Summer

    // Growth
    { name: 'ビジネス書', type: 'growth', season: 0, power: 1 }, // Spring
    { name: '英会話教材', type: 'growth', season: 3, power: 1 }, // Winter
    { name: 'プロテイン', type: 'growth', season: 1, power: 1 }, // Summer
    { name: 'セミナー受講', type: 'growth', season: 2, power: 1 }, // Autumn

    // Growth - Power 2
    { name: 'カリスマ指導', type: 'growth', season: 0, power: 2 }, // Spring

    // Efficiency
    { name: '時短調理器', type: 'efficiency', season: 3, power: 1 }, // Winter
    { name: 'ロボット掃除機', type: 'efficiency', season: 1, power: 1 }, // Summer
    { name: 'スマートウォッチ', type: 'efficiency', season: 0, power: 1 }, // Spring
    { name: '高速PC', type: 'efficiency', season: 2, power: 1 }, // Autumn

    // Efficiency - Power 2
    { name: '完全自動化AI', type: 'efficiency', season: 2, power: 2 } // Autumn
];

// --- Game State ---
class Game {
    constructor() {
        this.seasonIndex = 0; // Spring start
        this.player = { score: 0, stock: 0, hand: [] };
        this.rival = { score: 0, stock: 0, hand: [] };

        // Refactored from single customer to array
        this.customers = []; // Array of { type: ..., satisfaction: 0, ... }
        // Keep this.customer as a getter or just use customers[0] for legacy support?
        // Better to refactor usages. But for Tutorial compatibility, we might need care.

        this.gameMode = 'single'; // 'single' or 'multi'
        this.selectionState = 'neutral'; // 'neutral', 'select_target'
        this.selectedCardIndex = -1;

        this.turn = 1;
        this.state = 'title'; // title, start_screen, player_turn, player_burst, rival_turn, processing
        this.playerBurstRemaining = 0;
        this.winScore = 20;

        this.selectedStartCards = new Set();
        this.difficulty = 'easy'; // Default difficulty

        // Tutorial State
        this.isTutorial = false;
        this.tutorialStep = 0;

        this.showTitleScreen();
        this.bindEvents(); // NEW: Bind global buttons
    }

    // Compatibility Getter
    get customer() {
        return this.customers[0];
    }

    bindEvents() {
        // Title Screen Buttons
        const startBtn = document.getElementById('btn-title-start');
        if (startBtn) {
            startBtn.onclick = () => this.showModeSelectScreen();
        }
        const tutorialBtn = document.getElementById('btn-title-tutorial');
        if (tutorialBtn) {
            tutorialBtn.onclick = () => this.startTutorial();
        }

        // Global Return to Title
        const returnBtns = document.querySelectorAll('.btn-return-title-global');
        returnBtns.forEach(btn => {
            btn.onclick = () => {
                if (confirm('タイトル画面に戻りますか？')) {
                    this.returnToTitle();
                }
            };
        });

        // BGM Toggle
        const bgmBtn = document.getElementById('btn-toggle-bgm');
        if (bgmBtn) {
            bgmBtn.onclick = () => {
                if (this.audio) this.audio.toggleBGM();
            };
        }

        // Log Toggle
        const logBtn = document.getElementById('btn-log-toggle');
        if (logBtn) {
            logBtn.onclick = () => {
                const log = document.getElementById('battle-log');
                if (log) {
                    log.classList.toggle('expanded');
                    logBtn.innerText = log.classList.contains('expanded') ? "Close" : "Expand";
                }
            };
        }
    }

    returnToTitle() {
        this.isTutorial = false;
        this.tutorialStep = 0;

        // Full State Reset
        this.player = { score: 0, stock: 0, hand: [] };
        this.rival = { score: 0, stock: 0, hand: [] };
        this.customers = [];
        this.seasonIndex = 0;
        this.turn = 1;
        this.winner = null;
        this.selectedStartCards.clear();
        this.state = 'title';
        this.difficulty = 'easy'; // Default

        // Clear DOM remnants
        const logContent = document.getElementById('log-content');
        if (logContent) logContent.innerHTML = '';
        const wrapper = document.getElementById('customers-wrapper');
        if (wrapper) wrapper.innerHTML = '';
        document.getElementById('player-hand').innerHTML = '';
        document.getElementById('rival-hand').innerHTML = '';

        // Screens
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('mode-select-screen').style.display = 'none';
        document.getElementById('difficulty-select-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'none';

        // Stop BGM? (User maybe wants it off, or keep it? Usually title has BGM or no? Let's keep loop if on.)

        this.showTitleScreen();
    }

    init(startingHand) {
        this.state = 'player_turn';
        this.player.score = 0;
        this.rival.score = 0;
        // Determine Goal
        this.winScore = (this.gameMode === 'multi') ? 50 : 20;

        // Initialize Customers based on Mode
        this.customers = [];
        const count = (this.gameMode === 'multi' && !this.isTutorial) ? 3 : 1;

        for (let i = 0; i < count; i++) {
            // Create initial placeholders
            this.customers.push({ type: null, satisfaction: 0 });
            this.updateCustomer(i);
        }

        // Difficulty Visibility Setup
        const rivalHandEl = document.getElementById('rival-hand');
        if (this.difficulty === 'hard') {
            rivalHandEl.classList.remove('reveal');
        } else {
            rivalHandEl.classList.add('reveal');
        }

        // Rival Power 2: In Normal Mode, add some Power 2 cards to Rival
        this.rival.hand = [];
        // dealCards now handles difficulty logic (Power 2 cards)
        this.dealCards(this.rival, 5);

        // (Old Power 2 injection removed, simplified into dealCards)

        // Player Hand
        this.player.hand = [];
        if (startingHand && startingHand.length > 0) {
            this.player.hand = startingHand;
        } else {
            this.dealCards(this.player, 5);
        }

        this.updateUI();
        this.log('システム', `商戦を開始します。目標: ${this.winScore}pt`);
        this.log('システム', `難易度: ${this.difficulty.toUpperCase()}`);
        this.log('システム', `季節: ${SEASON_JP[this.seasonIndex]}`);

        if (this.isTutorial) {
            this.setupTutorialStep(1);
        }
    }

    startTutorial() {
        this.isTutorial = true;
        this.tutorialStep = 0;
        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
        document.getElementById('tutorial-overlay').style.display = 'flex';

        // Skip selection, force init
        this.init();
    }

    setupTutorialStep(step) {
        this.tutorialStep = step;
        const noteTitle = document.getElementById('tutorial-title');
        const noteText = document.getElementById('tutorial-text');

        // Reset state for clean step
        this.state = 'player_turn'; // Ensure interactive
        this.player.stock = 0;
        this.rival.stock = 0;
        this.player.hand = [];
        this.rival.hand = [];
        this.playerBurstRemaining = 0; // Ensure clear
        this.updateUI();

        // Specific Scenarios
        if (step === 1) {
            // Basic Point
            noteTitle.innerText = "Step 1: 基本";
            noteText.innerText = "商品を売るとポイントが得られます。\n手札のカードを選んでください。";

            this.player.hand = [{ name: '練習商品', type: 'safety', season: 0 }]; // Spring Safety
            this.customer.type = { id: 'growth', label: '成長', jp: '成長', color: '#2196f3', desc: '学び' }; // Mismatch
            this.seasonIndex = 2; // Autumn (Mismatch)
        } else if (step === 2) {
            // Include Preference Match
            noteTitle.innerText = "Step 2: ニーズ";
            noteText.innerText = "顧客の『ニーズ』に合うとポイント2倍！\n(今の顧客: 成長)";

            this.player.hand = [{ name: 'ビジネス書', type: 'growth', season: 0 }]; // Growth (Match)
            this.customer.type = { id: 'growth', label: '成長', jp: '成長', color: '#2196f3', desc: '学び' };
            this.seasonIndex = 2; // Mismatch
        } else if (step === 3) {
            // Season Match
            noteTitle.innerText = "Step 3: 季節";
            noteText.innerText = "『季節』に合うとポイント2倍！\n(今の季節: 秋)";

            this.player.hand = [{ name: '高級ワイン', type: 'pleasure', season: 2 }]; // Autumn (Match)
            this.customer.type = { id: 'efficiency', label: '効率', jp: '効率', color: '#ff9800', desc: '時短' }; // Mismatch
            this.seasonIndex = 2; // Autumn
        } else if (step === 4) {
            // Combo
            noteTitle.innerText = "Step 4: コンボ";
            noteText.innerText = "ニーズと季節、両方満たすとポイント4倍！";

            this.player.hand = [{ name: '老舗の和菓子', type: 'safety', season: 2 }]; // Safety + Autumn
            this.customer.type = { id: 'safety', label: '安心', jp: '安心', color: '#4caf50', desc: '定番' };
            this.seasonIndex = 2; // Autumn
        } else if (step === 5) {
            // Stock (Force Wait)
            noteTitle.innerText = "Step 5: ターン貯め";
            noteText.innerText = "『待機』でターンを貯められます (最大3)。\n次のターンにまとめて行動できます。\nまずは待機ボタンを押してください。";
            this.player.hand = [{ name: 'ダミー', type: 'safety', season: 0 }];

        } else if (step === 6) {
            // Burst
            noteTitle.innerText = "Step 5 (続き): 連続行動";
            noteText.innerText = "貯めたストックを使って連続行動！\n手札を2回選んでください。";

            this.player.stock = 1; // Give 1 stock (so 2 actions)
            this.player.hand = [
                { name: '商品A', type: 'safety', season: 0 },
                { name: '商品B', type: 'safety', season: 0 }
            ];
        } else if (step === 7) {
            // Free Play
            noteTitle.innerText = "実践";
            noteText.innerText = "20ポイント先取で勝利です。\n★顧客満足度(10pt)が貯まると客が変わります。\n自由に戦ってください！";
            // Check state cleanliness
            this.state = 'player_turn';
            this.player.score = 0;
            this.rival.score = 0;
            this.winScore = 20;
            this.player.stock = 0;

            // Fix Rival State: Ensure processing is done
            if (window.rivalTimeout) clearTimeout(window.rivalTimeout);

            this.dealCards(this.player, 5);
            this.dealCards(this.rival, 5); // Ensure rival has cards
            this.updateCustomer();

            setTimeout(() => {
                document.getElementById('tutorial-overlay').style.display = 'none';
            }, 3000);
        }

        this.updateUI();
        this.renderCustomerUI();
    }

    showTitleScreen() {
        document.getElementById('title-screen').style.display = 'flex';
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('mode-select-screen').style.display = 'none';
        document.getElementById('difficulty-select-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'none';

        document.getElementById('btn-title-start').onclick = () => {
            this.showModeSelectScreen();
        };
        document.getElementById('btn-title-tutorial').onclick = () => {
            this.startTutorial();
        };
    }

    showModeSelectScreen() {
        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('mode-select-screen').style.display = 'flex';

        document.getElementById('btn-mode-single').onclick = () => {
            this.gameMode = 'single';
            this.showDifficultySelectScreen();
        };
        document.getElementById('btn-mode-multi').onclick = () => {
            this.gameMode = 'multi';
            this.showDifficultySelectScreen();
        };
    }

    showDifficultySelectScreen() {
        document.getElementById('mode-select-screen').style.display = 'none';
        document.getElementById('difficulty-select-screen').style.display = 'flex';

        const setDifficulty = (diff) => {
            this.difficulty = diff;
            this.showStartScreen();
        };

        document.getElementById('btn-diff-easy').onclick = () => setDifficulty('easy');
        document.getElementById('btn-diff-normal').onclick = () => setDifficulty('normal');
        document.getElementById('btn-diff-hard').onclick = () => setDifficulty('hard');
    }

    showStartScreen() {
        document.getElementById('mode-select-screen').style.display = 'none';
        document.getElementById('difficulty-select-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
        const list = document.getElementById('start-card-list');
        list.innerHTML = '';
        this.selectedStartCards.clear();
        this.updateStartButton();

        // Generate 15 distinct candidates
        const candidates = [];
        // Ensure we have enough variety. Products list is small (16 items).
        // Let's shuffle PRODUCTS and take first 15 (or all of them if < 15, but we have 16).
        const shuffled = [...PRODUCTS].sort(() => 0.5 - Math.random());
        const choices = shuffled.slice(0, 15);

        choices.forEach((card, index) => {
            const el = document.createElement('div');
            el.className = 'card';
            // Store index to identify unique instance if needed, or object ref
            el.dataset.index = index;

            const seasonName = SEASON_JP[card.season];
            const typeObj = PREFERENCES.find(p => p.id === card.type);
            const typeName = typeObj ? typeObj.label : card.type;

            el.innerHTML = `
                <div class="card-left">
                    <div class="card-name">${card.name}</div>
                    ${(card.power || 1) > 1 ? '<span class="badge badge-power">商品力:2</span>' : '<span class="badge badge-weak">商品力:1</span>'}
                </div>
                <div class="card-right">
                    <div class="card-info-item">${typeName}</div>
                    <div class="card-info-item">${seasonName}</div>
                </div>
            `;
            el.onclick = () => this.toggleCardSelection(card, el);
            list.appendChild(el);
        });

        document.getElementById('btn-start-game').onclick = () => this.startGame();
    }

    toggleCardSelection(card, element) {
        if (this.selectedStartCards.has(card)) {
            this.selectedStartCards.delete(card);
            element.classList.remove('selected');
        } else {
            if (this.selectedStartCards.size >= 5) return; // Max 5

            // Check Power 2 Constraint
            if ((card.power || 1) === 2) {
                // Count how many Power 2 cards are already selected
                let power2Count = 0;
                this.selectedStartCards.forEach(c => {
                    if ((c.power || 1) === 2) power2Count++;
                });
                if (power2Count >= 1) {
                    alert('商品力2のカードは1枚までしか選べません。');
                    return;
                }
            }

            this.selectedStartCards.add(card);
            element.classList.add('selected');
        }
        this.updateStartButton();
    }

    updateStartButton() {
        const count = this.selectedStartCards.size;
        document.getElementById('selected-count').innerText = count;
        const btn = document.getElementById('btn-start-game');
        btn.disabled = count !== 5;
        btn.style.opacity = count === 5 ? 1 : 0.5;
    }

    startGame() {
        if (this.selectedStartCards.size !== 5) return;
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
        // Convert Set to Array
        this.init(Array.from(this.selectedStartCards));
    }

    getRandomProduct() {
        return PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    }

    dealCards(entity, count) {
        const isRival = (entity === this.rival);
        const difficulty = this.difficulty;

        for (let i = 0; i < count; i++) {
            let card;

            if (isRival && !this.isTutorial) {
                // Difficulty Logic for Rival (Normal/Hard)
                const currentPower2 = entity.hand.filter(c => (c.power || 1) === 2).length;
                let targetPower2 = 0;
                if (difficulty === 'normal') targetPower2 = 1;
                if (difficulty === 'hard') targetPower2 = 2;

                if (currentPower2 < targetPower2) {
                    // Need Power 2
                    const power2Candidates = PRODUCTS.filter(p => p.power === 2);
                    card = power2Candidates[Math.floor(Math.random() * power2Candidates.length)];
                } else if (currentPower2 > targetPower2) {
                    const normalCandidates = PRODUCTS.filter(p => !p.power || p.power === 1);
                    card = normalCandidates[Math.floor(Math.random() * normalCandidates.length)];
                } else {
                    const normalCandidates = PRODUCTS.filter(p => !p.power || p.power === 1);
                    card = normalCandidates[Math.floor(Math.random() * normalCandidates.length)];
                }
            } else {
                // Player or Tutorial Rival
                // TUTORIAL FIX: No Power 2 Cards allowed for anyone in Tutorial
                if (this.isTutorial) {
                    const normalCandidates = PRODUCTS.filter(p => !p.power || p.power === 1);
                    card = normalCandidates[Math.floor(Math.random() * normalCandidates.length)];
                } else {
                    card = this.getRandomProduct();
                }
            }

            // Fallback if unavailable
            if (!card) card = this.getRandomProduct();


            // Rival Nerf Logic (Retain existing logic but maybe tune it?)
            // Only apply if entity is rival AND (not tutorial OR tutorial step >= 7)
            const isFreePlay = (!this.isTutorial || this.tutorialStep >= 7);

            if (isRival && isFreePlay) {
                // Check if card is "Good" (Match or Season)
                const isMatch = (card.type === this.customer.type.id);
                const isSeason = (card.season === this.seasonIndex);

                if (isMatch || isSeason) {
                    // 50% chance to discard and redraw (Simple nerf)
                    // But if we forced a Power 2 above, we should keep it to respect difficulty?
                    // Let's decide: Difficulty overrides nerf?
                    // Or nerf rerolls it into another random card?
                    // Let's skip nerf if we specifically needed a Power 2 for difficulty quota.
                    // If the card we needed (Power 2) happens to be good match, let them keep it.
                    // Only nerf if it wasn't a "Quota Fill".
                    // For simplicity, let's just disabling nerf if difficulty is set (Hard mode shouldn't nerf? Easy should?)

                    // Let's just keep the nerf for now unless it's Hard mode?
                    // Requested: Hard = 2 Power 2.
                    // If we reroll a Power 2, we might lose the quota.
                    // So skip nerf if card.power == 2.
                    if ((card.power || 1) === 2) {
                        // Keep it (Hard/Normal quota)
                    } else if (Math.random() < 0.5) {
                        // Redraw once
                        // Force normal again to avoid accidental Power 2 if quota full
                        const normalCandidates = PRODUCTS.filter(p => !p.power || p.power === 1);
                        card = normalCandidates[Math.floor(Math.random() * normalCandidates.length)];
                    }
                }
            }

            entity.hand.push(card);
        }
    }

    updateCustomer(index = 0) {
        if (!this.customers[index]) return;

        // Change customer preference randomly
        const pref = PREFERENCES[Math.floor(Math.random() * PREFERENCES.length)];
        this.customers[index].type = pref;
        this.customers[index].satisfaction = 0; // Reset local satisfaction

        this.log('システム', `顧客[${index + 1}]が登場！好み: ${pref.label} (${pref.desc})`);

        // Update 3D Model logic (handled via event or direct call if simple)
        // Note: 3D model currently only supports one. We might need to disable or adapt.
        // For now, only update if index 0
        if (index === 0 && window.updateCustomerScene) window.updateCustomerScene(pref.id);

        this.renderCustomerUI();
    }

    changeSeason() {
        this.seasonIndex = (this.seasonIndex + 1) % 4;
        this.updateSeasonUI();
        this.log('システム', `季節が ${SEASON_JP[this.seasonIndex]} に変わりました。`);
    }

    // --- Action Effects ---

    showScoreEffect(basePoints, isMatch, isSeason, targetIndex = 0) {
        // Find Target
        const wrapper = document.getElementById('customers-wrapper');
        let targetEl = document.querySelector('.center-area'); // Fallback

        let isAbsolute = false;
        if (wrapper && wrapper.children[targetIndex]) {
            targetEl = wrapper.children[targetIndex];
            isAbsolute = true;
        }

        const popup = document.createElement('div');
        popup.className = 'score-popup';

        // If targeting specific customer, append to that customer's element to localise it
        // OR append to body/game-container and position absolute using Rect.
        // Appending to customer-unit is easier if it has 'position: relative'.
        // Let's assume customer-unit is relative (checked css).
        // Actually, let's just append to the customer-unit so it moves with it? 
        // No, customer-unit handles layout. 
        // Let's append to targetEl (customer-unit) and rely on CSS to position it centered.

        if (isAbsolute) {
            targetEl.appendChild(popup);
            popup.style.position = 'absolute';
            popup.style.top = '-50px'; // Above head
            popup.style.left = '50%';
            popup.style.transform = 'translateX(-50%)';
            // We need to override the keyframes or ensure they work with this transform.
            // Existing keyframes use transform. We might need to handle this.
            // popIn usually scales.
        } else {
            targetEl.appendChild(popup);
        }

        // Logic for Value Calculation
        let multiplier = 1;
        if (isMatch) multiplier *= 2;
        if (isSeason) multiplier *= 2;

        let base = basePoints / multiplier;
        // Safety: if base < 1, clamp to 1
        base = Math.max(1, base);

        // Sequence: Base -> Base*2 -> Base*4
        let currentVal = base;
        let step = 0;

        // Initial State
        popup.innerText = currentVal;

        // Force Yellow Color, Text Shadow, High Z-Index
        popup.style.color = '#ffeb3b';
        popup.style.textShadow = '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000';
        popup.style.zIndex = '1000';
        popup.style.fontWeight = '900';

        // If absolute, we need to respect the centering transform. 
        // Force Yellow Color and large font
        popup.style.color = '#ffeb3b';
        popup.style.animation = 'popIn 0.3s forwards';

        const performStep = () => {
            step++;
            let targetSteps = 0;
            if (isMatch && isSeason) targetSteps = 2;
            else if (isMatch || isSeason) targetSteps = 1;

            if (step > targetSteps) {
                setTimeout(() => popup.remove(), 1200);
                return;
            }

            // Update Text (Replacement)
            currentVal *= 2;
            let suffix = "!".repeat(step);
            popup.innerText = `${currentVal}${suffix}`;

            // Reflow
            popup.style.animation = 'none';
            popup.offsetHeight;

            // Grow font size
            const baseSize = 48;
            popup.style.fontSize = (baseSize + (step * 24)) + 'px';

            // Re-apply correct animation
            popup.style.animation = 'popBump 0.3s forwards';

            setTimeout(performStep, 600);
        };

        setTimeout(performStep, 600);
    }

    triggerCustomerReaction(points, targetIndex = 0) {
        // Find specific customer element
        const wrapper = document.getElementById('customers-wrapper');
        if (!wrapper || !wrapper.children[targetIndex]) return;

        const customerUnit = wrapper.children[targetIndex];
        const avatarBody = customerUnit.querySelector('.avatar-body');

        // Remove old anims
        avatarBody.classList.remove('anim-happy', 'anim-joy', 'anim-ecstasy');
        void avatarBody.offsetWidth; // Trigger reflow

        if (points >= 8) avatarBody.classList.add('anim-ecstasy'); // 4x + Power 2
        else if (points >= 4) avatarBody.classList.add('anim-ecstasy');
        else if (points >= 2) avatarBody.classList.add('anim-joy');
        else avatarBody.classList.add('anim-happy');
    }

    showRivalScorePopup(basePoints, isMatch, isSeason, cardIndex) {
        // Target specific card in rival hand
        const rivalHandDiv = document.getElementById('rival-hand');
        if (!rivalHandDiv || !rivalHandDiv.children[cardIndex]) return;

        const targetEl = rivalHandDiv.children[cardIndex];
        const rect = targetEl.getBoundingClientRect();

        // Create Popup attached to Body (to avoid clipping)
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.style.position = 'absolute';

        // Center on card rect
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        popup.style.left = `${centerX}px`;
        popup.style.top = `${centerY}px`;
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.color = '#ff5252'; // Red for Rival
        popup.style.textShadow = '2px 2px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff';
        popup.style.zIndex = '2001'; // Higher than everything
        popup.style.fontWeight = '900';
        popup.style.pointerEvents = 'none'; // Click through

        document.body.appendChild(popup);

        // Logic for Value Calculation
        let multiplier = 1;
        if (isMatch) multiplier *= 2;
        if (isSeason) multiplier *= 2;

        let base = basePoints / multiplier;
        base = Math.max(1, base);

        let currentVal = base;
        let step = 0;

        // Initial State
        popup.innerText = currentVal;
        popup.style.animation = 'popIn 0.3s forwards';

        const performStep = () => {
            step++;
            let targetSteps = 0;
            if (isMatch && isSeason) targetSteps = 2;
            else if (isMatch || isSeason) targetSteps = 1;

            if (step > targetSteps) {
                setTimeout(() => popup.remove(), 1200);
                return;
            }

            // Update Text
            currentVal *= 2;
            let suffix = "!".repeat(step);
            popup.innerText = `${currentVal}${suffix}`;

            // Reflow
            popup.style.animation = 'none';
            popup.offsetHeight;

            // Grow font size
            const baseSize = 32;
            popup.style.fontSize = (baseSize + (step * 16)) + 'px';

            // Re-apply correct animation
            popup.style.animation = 'popBump 0.3s forwards';

            setTimeout(performStep, 600);
        };

        setTimeout(performStep, 600);
    }

    // --- Actions ---

    playerWait() {
        if (this.player.stock >= 3) {
            this.log('警告', 'Stockは最大3までです。');
            return;
        }
        this.player.stock++;
        this.log('Player', '待機しました。(Stock +1)');

        // Visually disable UI immediately to show turn end
        this.state = 'processing';
        this.updateUI();

        if (this.isTutorial && this.tutorialStep === 5) {
            // Transition to Burst Step
            // Transition directly to Free Play (Step 7) as requested
            setTimeout(() => this.setupTutorialStep(7), 1000);
            return;
        }

        this.endPlayerTurn();
    }

    playerUseCard(cardIndex, targetIndex = 0) {
        const card = this.player.hand[cardIndex];
        const targetCustomer = this.customers[targetIndex];

        // Calculate Score (Separated for visualization)
        let multiplier = 1;
        const isMatch = (card.type === targetCustomer.type.id);
        const isSeason = (card.season === this.seasonIndex);

        if (isMatch) multiplier *= 2;
        if (isSeason) multiplier *= 2;

        const points = (card.power || 1) * multiplier;
        this.player.score += points;

        // Update Target Satisfaction
        targetCustomer.satisfaction += points;

        // Check rotation for this specific customer
        let rotated = false;
        if (targetCustomer.satisfaction >= ROTATION_INTERVAL) {
            this.updateCustomer(targetIndex);
            rotated = true;
        }
        // Show Visuals
        // Reuse calculated flags

        // Pass targetIndex to locallize the popup
        this.showScoreEffect(points, isMatch, isSeason, targetIndex);
        this.triggerCustomerReaction(points, targetIndex);

        this.log('Player', `顧客${targetIndex + 1}に ${card.name} を提供。${points}pt獲得！`);

        // Cards are not consumed (Persistent Hand)

        if (this.state === 'waiting_for_extra_action') {
            // Consuming Stock for this action
            this.player.stock--;
            this.log('Player', 'ストック使用 (残り: ' + this.player.stock + ')');
        }

        if (this.state === 'player_burst') {
            // Tutorial Logic (Legacy Burst)
            this.playerBurstRemaining--;
            this.updateUI();
            if (this.playerBurstRemaining <= 0) {
                this.state = 'processing';
                if (this.isTutorial && this.tutorialStep === 6) {
                    setTimeout(() => this.setupTutorialStep(7), 2000);
                    return;
                }
                setTimeout(() => this.endPlayerTurn(), 2000);
            }
        } else {
            // Strategy Logic

            // If in Tutorial Steps 1-4, Standard logic
            if (this.isTutorial && this.tutorialStep < 5) {
                this.state = 'processing';
                this.updateUI();
                setTimeout(() => this.setupTutorialStep(this.tutorialStep + 1), 2500);
                this.endPlayerTurn();
                return;
            }

            // Normal Game (or Tutorial Free Play)
            // Check if we have stock to continue
            if (this.player.stock > 0) {
                this.state = 'waiting_for_extra_action';
                this.updateUI(); // Updates buttons
                // Don't end turn
            } else {
                // No stock left, end turn
                this.state = 'processing';
                this.updateUI();
                this.endPlayerTurn();
            }
        }
    }

    // Calculation
    calculateScore(card) {
        let multiplier = 1;
        let isMatch = false;
        let isSeason = false;

        // Preference Match
        if (card.type === this.customer.type.id) {
            multiplier *= 2;
            isMatch = true;
        }

        // Season Match
        if (card.season === this.seasonIndex) {
            multiplier *= 2;
            isSeason = true;
        }

        // Both (x4 is naturally 2*2)

        return (card.power || 1) * multiplier;
    }

    checkWin() {
        if (this.player.score >= this.winScore) return 'player';
        if (this.rival.score >= this.winScore) return 'rival';
        return null;
    }

    // --- Turn Management ---

    endPlayerTurn() {
        // Check win
        if (this.checkWin()) return this.endGame(this.checkWin());

        // Customer Rotate check (Player score added)
        this.processCustomerRotation();

        this.updateUI();
        this.state = 'rival_turn';

        // Fix: Use window.rivalTimeout to allow clearing if needed
        window.rivalTimeout = setTimeout(() => this.rivalAI(), 2000);
    }

    rivalAI() {
        this.log('Rival', '思考中...');

        if (this.isTutorial && this.tutorialStep < 7) {
            // Passive Rival in Tutorial
            this.endRivalTurn();
            return;
        }

        // Safety Check for Step 7 initialization race conditions
        if (this.rival === undefined || this.rival.hand.length === 0) {
            console.log("Rival Hand Empty, skipping turn or refilling");
            // Emergency refill for Step 7 stability
            if (this.tutorialStep === 7) this.dealCards(this.rival, 5);
        }

        // Simple AI:
        setTimeout(() => {
            // Stock logic
            if (this.rival.stock < 2 && Math.random() < 0.2) {
                this.rival.stock++;
                this.log('Rival', '待機しました。(Stock +1)');
                this.endRivalTurn();
                return;
            }

            // Determine how many actions (Stock + 1)
            let actions = 1 + this.rival.stock;
            this.rival.stock = 0; // Consume stock

            this.runRivalActionLoop(actions);
        }, 1000);
    }

    runRivalActionLoop(actionsRemaining) {
        if (actionsRemaining <= 0) {
            this.endRivalTurn();
            return;
        }

        // Pick best card AND target
        // For Single: just calculateScore(card).
        // For Multi: calculateScore(card, target) for all targets.

        let bestMove = { score: -1, cardIndex: -1, targetIndex: -1 };

        this.rival.hand.forEach((card, cIdx) => {
            this.customers.forEach((cust, tIdx) => {
                let score = (card.power || 1);
                if (card.type === cust.type.id) score *= 2;
                if (card.season === this.seasonIndex) score *= 2;

                // Add randomness or priority?
                // Simple max score
                if (score > bestMove.score) {
                    bestMove = { score, cardIndex: cIdx, targetIndex: tIdx };
                }
            });
        });

        // Execute
        const card = this.rival.hand[bestMove.cardIndex];
        const points = bestMove.score;
        const targetInd = bestMove.targetIndex;

        // Calculate factors for visual properties
        const targetCust = this.customers[targetInd];
        const isMatch = (card.type === targetCust.type.id);
        const isSeason = (card.season === this.seasonIndex);

        // Show Rival Score Popup
        this.showRivalScorePopup(points, isMatch, isSeason, bestMove.cardIndex);

        // Also trigger customer reaction!
        this.triggerCustomerReaction(points, targetInd);

        this.rival.score += points;
        this.customers[targetInd].satisfaction += points;

        this.log('Rival', `${card.name} を顧客${targetInd + 1}に提案！ -> ${points}pt獲得`);

        if (this.customers[targetInd].satisfaction >= ROTATION_INTERVAL) {
            this.updateCustomer(targetInd);
        }

        setTimeout(() => {
            if (this.checkWin()) {
                this.endGame(this.checkWin());
                return;
            }
            this.runRivalActionLoop(actionsRemaining - 1);
        }, 1000);
    }

    endRivalTurn() {
        if (this.checkWin()) return this.endGame(this.checkWin());

        // Season Change (After Rival finishes)
        this.changeSeason();

        this.turn++;
        this.state = 'player_turn';
        this.updateUI();
    }

    processCustomerRotation() {
        // Disabled global rotation logic. 
        // Rotation is now handled per-customer in playerUseCard/rivalAI.

        // Could be used for visual sync if needed, but renderCustomerUI does it.
    }

    endGame(winner) {
        this.state = 'finished';
        const msg = winner === 'player' ? 'YOU WIN!' : 'YOU LOSE...';
        this.log('システム', `ゲーム終了！ ${msg}`);

        if (this.isTutorial) {
            alert('チュートリアル完了！タイトルに戻ります。');
            this.isTutorial = false;
            this.showTitleScreen();
        } else {
            alert(msg); // Basic feedback
            this.updateUI(); // Disable controls
            // In future, might want a "Back to Title" button here for normal game too
            // For now, leave as is for normal game or auto-reset? 
            // Let's add a timeout to return to title for normal game too, or just leave it?
            // User only asked for Tutorial -> Title.
        }
    }

    // --- UI bindings ---

    log(sender, message) {
        const box = document.getElementById('log-content');
        const entry = document.createElement('div');
        entry.className = `log-entry ${sender === 'Player' ? 'player-action' : sender === 'Rival' ? 'rival-action' : 'system'}`;
        entry.textContent = `[${sender}] ${message}`;
        box.prepend(entry);
        // JS: appendChild. scrollIntoView.
    }

    updateUI() {
        // Scores (Gauge Update)
        const pScoreText = document.getElementById('p-score-text');
        const rScoreText = document.getElementById('r-score-text');
        const pScoreGauge = document.getElementById('p-score-gauge');
        const rScoreGauge = document.getElementById('r-score-gauge');

        let goalText = ` / ${this.winScore}`;

        // Text Update
        if (pScoreText) pScoreText.innerText = this.player.score + goalText;
        if (rScoreText) rScoreText.innerText = this.rival.score + goalText;

        // Gauge Update
        const pPercent = Math.min(100, Math.max(0, (this.player.score / this.winScore) * 100));
        const rPercent = Math.min(100, Math.max(0, (this.rival.score / this.winScore) * 100));

        if (pScoreGauge) pScoreGauge.style.width = `${pPercent}%`;
        if (rScoreGauge) rScoreGauge.style.width = `${rPercent}%`;

        // Stock Icons (Updated)
        const generateStockIcons = (count) => {
            let html = '';
            for (let i = 0; i < 3; i++) {
                // Fill if i < count
                const isActive = i < count ? 'active' : '';
                html += `<span class="stock-icon ${isActive}">💡</span>`;
            }
            return html;
        };
        document.getElementById('p-stock').innerHTML = generateStockIcons(this.player.stock);
        document.getElementById('r-stock').innerHTML = generateStockIcons(this.rival.stock);

        // Season
        const seasonDisplay = document.getElementById('season-display');
        seasonDisplay.className = `season-badge ${SEASONS[this.seasonIndex].toLowerCase()}`;
        document.getElementById('season-text').innerText = SEASON_JP[this.seasonIndex];

        // Player Hand

        // Rival Hand (NEW)
        const rivalHandDiv = document.getElementById('rival-hand');
        rivalHandDiv.innerHTML = '';
        this.rival.hand.forEach((card) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';

            // Should contain full info so CSS reveal works
            const seasonName = SEASON_JP[card.season];
            const typeObj = PREFERENCES.find(p => p.id === card.type);
            const typeName = typeObj ? typeObj.label : card.type;
            const isPower2 = (card.power || 1) === 2;
            const powerLabel = isPower2 ?
                `<span style="color: #ff9800; font-weight:bold;">商品力:2</span>` :
                `<span>商品力:1</span>`;

            cardEl.innerHTML = `
                <div class="card-left">
                    <div class="card-name">${card.name}</div>
                    <div class="card-badges">
                        ${(card.season === this.seasonIndex) ? '<span class="badge badge-season">★旬★</span>' : ''}
                        ${(isPower2) ? '<span class="badge badge-power">強</span>' : ''}
                    </div>
                </div>
                <div class="card-right">
                    <div class="card-info-item">${typeName}</div>
                    <div class="card-info-item">${seasonName}</div>
                    <div class="card-info-item">${powerLabel}</div>
                </div>
            `;
            rivalHandDiv.appendChild(cardEl);
        });

        // Player Hand (Original Block Follows)
        const handDiv = document.getElementById('player-hand');
        handDiv.innerHTML = '';
        this.player.hand.forEach((card, idx) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';

            // Interaction
            let allowInteract = (this.state === 'player_turn' || this.state === 'player_burst' || this.state === 'waiting_for_extra_action');
            if (this.isTutorial && this.tutorialStep === 5) allowInteract = false;

            if (allowInteract) {
                cardEl.onclick = () => this.onPlayerCardClick(idx);
            } else {
                cardEl.classList.add('disabled');
            }

            // Content
            const isSeasonal = (card.season === this.seasonIndex);

            // Match Logic: Check against ANY customer (Multi-mode aware)
            const isMatch = this.customers.some(c => c.type.id === card.type);
            const isPower2 = (card.power || 1) === 2;

            let badges = '';
            if (isSeasonal) badges += `<span class="badge badge-season">★旬★</span>`;
            if (isMatch) badges += `<span class="badge badge-match">◎マッチ◎</span>`;

            // Resolve Labels
            const seasonName = SEASON_JP[card.season];
            const typeObj = PREFERENCES.find(p => p.id === card.type);
            const typeName = typeObj ? typeObj.label : card.type;

            // Power Label
            const powerLabel = isPower2 ?
                `<span style="color: #ff9800; font-weight:bold;">商品力:2</span>` :
                `<span>商品力:1</span>`;

            cardEl.innerHTML = `
                <div class="card-left">
                    <div class="card-name">${card.name}</div>
                    <div class="card-badges">${badges}</div>
                </div>
                <div class="card-right">
                    <div class="card-info-item">属性: ${typeName}</div>
                    <div class="card-info-item">季節: ${seasonName}</div>
                    <div class="card-info-item">${powerLabel}</div>
                </div>
            `;
            handDiv.appendChild(cardEl);
        });

        // Wait/End Turn Button
        const waitBtn = document.getElementById('btn-wait');
        let showWait = true;

        // Tutorial Constraints
        if (this.isTutorial && this.tutorialStep < 5) showWait = false;

        if (showWait) {
            waitBtn.style.display = 'block';

            if (this.state === 'waiting_for_extra_action') {
                // Special State: "Finish Turn"
                waitBtn.innerText = 'ターン終了 (残りを持ち越す)';
                waitBtn.onclick = () => this.endPlayerTurn();
                waitBtn.disabled = false;
                waitBtn.style.opacity = 1;
                waitBtn.classList.remove('secondary');
                waitBtn.classList.add('primary'); // Make it look distinct if possible, or just default
            } else if (this.state === 'player_turn' && this.player.stock < 3) {
                // Normal Wait
                waitBtn.innerText = '待機 (貯める)';
                waitBtn.onclick = () => this.playerWait();
                waitBtn.disabled = false;
                waitBtn.style.opacity = 1;
                waitBtn.classList.add('secondary');
            } else {
                // Disabled
                waitBtn.innerText = '待機 (貯める)';
                waitBtn.disabled = true;
                waitBtn.onclick = null;
                waitBtn.style.opacity = 0.5;
            }
        } else {
            waitBtn.style.display = 'none';
        }

        if (this.state === 'waiting_for_extra_action') {
            document.getElementById('message-area').innerText = `ストック使用可能！カードを選んで連続行動するか、終了してください。`;
        } else if (this.state === 'player_burst') {
            // Legacy burst (Tutorial)
            document.getElementById('message-area').innerText = `連続行動中！あと ${this.playerBurstRemaining} 回選択してください`;
            waitBtn.style.display = 'none';
        } else {
            // Check if single customer or multi
            if (this.customers.length === 1 && this.customers[0].type) {
                document.getElementById('message-area').innerText = `顧客: ${this.customers[0].type.jp} (${this.customers[0].type.desc})`;
            } else {
                document.getElementById('message-area').innerText = `バトル進行中`;
            }
        }

        // Ensure Gauges are updated
        this.renderCustomerUI();
    }

    renderCustomerUI() {
        const wrapper = document.getElementById('customers-wrapper');
        // Ensure wrapper has correct number of children
        while (wrapper.children.length < this.customers.length) {
            const el = document.createElement('div');
            el.className = 'customer-unit';
            el.innerHTML = `
                <div class="avatar-group">
                    <div class="avatar-head"></div>
                    <div class="avatar-body"></div>
                </div>
                <div class="customer-info" style="width:100%">
                    <div class="customer-label"></div>
                    <div class="preference-badge" style="font-size: 14px; padding: 5px 10px;"></div>
                    <div class="satisfaction-container">
                        <div class="satisfaction-label">満足度</div>
                        <div class="satisfaction-bar-bg">
                            <div class="satisfaction-bar-fill"></div>
                        </div>
                        <div class="satisfaction-text"></div>
                    </div>
                </div>`;
            wrapper.appendChild(el);
        }
        // Remove excess
        while (wrapper.children.length > this.customers.length) {
            wrapper.removeChild(wrapper.lastChild);
        }

        this.customers.forEach((cust, index) => {
            const el = wrapper.children[index];

            // Selection Styling check (don't overwrite full class if possible, just toggle selectable)
            if (this.selectionState === 'select_target') {
                el.classList.add('selectable');
                el.onclick = () => this.handleCustomerClick(index);
            } else {
                el.classList.remove('selectable');
                el.onclick = null;
            }

            // Target Overlay
            // existing overlay?
            let overlay = el.querySelector('.match-indicator-overlay');
            if (overlay) overlay.remove();

            const isTarget = (this.selectionState === 'select_target');
            if (isTarget && this.selectedCardIndex >= 0) {
                const selectedCard = this.player.hand[this.selectedCardIndex];
                if (selectedCard && selectedCard.type === cust.type.id) {
                    const ov = document.createElement('div');
                    ov.className = 'match-indicator-overlay';
                    ov.innerText = '◎マッチ';
                    // Insert before avatar
                    el.insertBefore(ov, el.firstChild);
                }
            }

            // Update Content
            const label = el.querySelector('.customer-label');
            label.innerText = `Customer ${index + 1}`;

            const badge = el.querySelector('.preference-badge');
            badge.innerText = cust.type.jp;
            badge.style.borderColor = cust.type.color;

            // Update Avatar Colors
            const body = el.querySelector('.avatar-body');
            body.style.background = cust.type.color; // Simplify for now

            // Gauge
            const percentage = Math.min(100, (cust.satisfaction / ROTATION_INTERVAL) * 100);
            const fill = el.querySelector('.satisfaction-bar-fill');
            fill.style.width = `${percentage}%`;

            const text = el.querySelector('.satisfaction-text');
            text.innerText = `${cust.satisfaction} / ${ROTATION_INTERVAL}`;
        });
    }

    updateSeasonUI() {
        // Redundant call to updateUI basically handles this, but ensuring animation class trigger could be here
        this.updateUI();
    }

    onPlayerCardClick(idx) {
        if (this.state === 'player_turn') {
            // First Action of Turn
            this.handleCardSelection(idx);
        } else if (this.state === 'waiting_for_extra_action') {
            // Extra Action using Stock
            this.handleCardSelection(idx);
        } else if (this.state === 'player_burst') {
            // Tutorial Burst
            this.handleCardSelection(idx);
        }
    }

    handleCardSelection(idx) {
        if (this.state === 'waiting_for_extra_action') {
            // Check if we actually have stock (Safety)
            if (this.player.stock <= 0) {
                this.endPlayerTurn();
                return;
            }
        }

        if (this.gameMode === 'single') {
            this.playerUseCard(idx, 0); // Target 0
        } else {
            // Multi Mode: Select Target
            this.selectionState = 'select_target';
            this.selectedCardIndex = idx;
            this.log('システム', '商品を売る顧客を選んでください。');
            this.renderCustomerUI(); // Show highlight
        }
    }

    handleCustomerClick(customerIndex) {
        if (this.selectionState === 'select_target') {
            this.playerUseCard(this.selectedCardIndex, customerIndex);
            this.selectionState = 'neutral';
            this.selectedCardIndex = -1;
            this.renderCustomerUI(); // Clear highlight
        }
    }
}

// Global Log Helper for non-class access if needed
function logToBox(msg) {
    const box = document.getElementById('log-content');
    box.innerHTML += `<div>${msg}</div>`;
}

// Init
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

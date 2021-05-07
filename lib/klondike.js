const KlondikeDeck = () => {
    const suits = ["S", "C", "H", "D"];

    let deck = [];
    suits.forEach((suit) => {
        for (let value = 1; value <= 13; value++) {
            deck.push(Card(value, suit));
        }
    });

    shuffle(deck);

    return deck;
}

const KlondikeField = () => {
    const deck = CardStack(defaultBackcolor, 5);
    const drop = CardStack(undefined, 5);

    const foundations = [];
    for (let i = 0; i < 4; i++) {
        foundations.push(CardStack(undefined, 5));
    }

    const stacks = [];
    for (let i = 0; i < 7; i++) {
        stacks.push(CardFanVer(undefined, 6 + 13));
    }

    const dragged = CardFanVer(undefined, 13);

    return inherit(null, {
        deck,
        drop,
        foundations,
        stacks,

        dragged,
        draggedPos: { x: 0, y: 0 },
        draggedStartTarget: null,
        clickTarget: null,

        initialize(engine) {
            this.reset();
            this.register(engine);
        },

        reset() {
            this.deck.cards = [];
            this.drop.cards = [];
            this.foundations.forEach((foundation) => {
                foundation.cards = [];
            });
            this.stacks.forEach((stack) => {
                stack.cards = [];
            });
            this.dragged.cards = [];
            this.deal();
        },

        register(engine) {
            engine.drawObjects.push(this);

            const resolvePos = (event) => {
                const rect = engine.canvas.dom.getBoundingClientRect();
                return {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top
                };
            };

            const targetEqual = (target1, target2) => {
                if (target1 === target2) return true;
                if (target1 === null && target2 !== null) return false;
                if (target2 === null && target1 !== null) return false;

                return (
                    target1.location === target2.location &&
                    target1.index === target2.index &&
                    target1.subindex == target2.subindex
                );
            };

            const targetDebug = (target) => {
                if (target === null) {
                    return "nowhere";
                } else if (target.subindex !== undefined) {
                    return `${target.location}:${target.index}:${target.subindex}`;
                } else if (target.index !== undefined) {
                    return `${target.location}:${target.index}`;
                } else {
                    return `${target.location}`;
                }
            };

            engine.canvas.dom.addEventListener("mousedown", (event) => {
                const pos = resolvePos(event);
                const target = this.findClick(engine.canvas, engine.assetLoader, pos);
                this.draggedStartTarget = target;
                this.clickTarget = target;

                console.debug(`[Klondike] mousedown at ${targetDebug(target)}`);

                if (target !== null && target.location !== "deck") {
                    // deck is the only clickable target, cancel all other clicks
                    this.clickTarget = null;
                }

                this.startDrag(target);
            });

            engine.canvas.dom.addEventListener("mousemove", (event) => {
                // return early if not dragging
                if (this.draggedStartTarget === null) return;

                const pos = resolvePos(event);
                const target = this.findClick(engine.canvas, engine.assetLoader, pos);
                if (!targetEqual(target, this.clickTarget)) {
                    this.clickTarget = null;
                }

                this.draggedPos = pos;
            });

            engine.canvas.dom.addEventListener("mouseup", (event) => {
                const target = this.findClick(engine.canvas, engine.assetLoader, resolvePos(event));
                if (this.clickTarget !== null && targetEqual(target, this.clickTarget)) {
                    this.clickTarget = null;

                    // click event
                    console.debug(`[Klondike] click event at ${targetDebug(target)}`);

                    if (target.location === "deck") {
                        this.nextDrop();
                    }
                } else {
                    // drag/drop event
                    console.debug(`[Klondike] drag/drop event from ${targetDebug(this.draggedStartTarget)} to ${targetDebug(target)}`);
                    if (!this.stopDrag(target)) {
                        this.cancelDrag();
                    } else {
                        this.revealTop();
                    }
                }
            });
        },

        startDrag(target) {
            if (target === null) return;

            if (target.location === "drop") {
                if (this.drop.cards.length > 0) {
                    this.dragged.cards.push(this.drop.cards.pop());
                }
            } else if (target.location === "foundation") {
                const foundation = this.foundations[target.index];
                if (foundation.cards.length > 0) {
                    this.dragged.cards.push(foundation.cards.pop());
                }
            } else if (target.location === "stack") {
                const stack = this.stacks[target.index];
                if (stack.cards.length === 0) return;

                const substack = stack.cards.slice(target.subindex);
                if (substack.length === 0) return;

                let last = substack[0];
                if (last.hidden) return;

                for (let i = 1; i < substack.length; i++) {
                    const cur = substack[i];

                    if (cur.hidden) return;
                    if (last.color() === cur.color()) return;
                    if (last.value !== cur.value - 1) return;

                    last = cur;
                }

                this.dragged.cards = substack;
                stack.cards = stack.cards.slice(0, target.subindex);
            }
        },

        stopDrag(target) {
            if (target === null) return false;
            if (this.dragged.cards.length === 0) return false;
            const bottom_card = this.dragged.cards[0];

            if (target.location === "foundation") {
                const suits = ["H", "C", "D", "S"];
                const foundation = this.foundations[target.index];

                if (this.dragged.cards.length !== 1) return false;
                if (bottom_card.suit !== suits[target.index]) return false;

                foundation.cards.push(bottom_card);
                this.clearDrag();
                return true;
            } else if (target.location === "stack") {
                const stack = this.stacks[target.index];

                if (stack.cards.length === 0) {
                    if (bottom_card.value !== 13) return false;
                } else {
                    const target_top_card = stack.cards[stack.cards.length - 1];
                    if (target_top_card.hidden) return false;
                    if (bottom_card.color() === target_top_card.color()) return false;
                    if (bottom_card.value !== target_top_card.value - 1) return false;
                }

                stack.cards = stack.cards.concat(this.dragged.cards);
                this.clearDrag();
                return true;
            }

            return false;
        },

        cancelDrag() {
            const target = this.draggedStartTarget;
            if (target.location === "drop") {
                this.drop.cards.push(this.dragged.cards.pop());
            } else if (target.location === "foundation") {
                const foundation = this.foundations[target.index];
                foundation.cards.push(this.dragged.cards.pop());
            } else if (target.location === "stack") {
                const stack = this.stacks[target.index];
                stack.cards = stack.cards.concat(this.dragged.cards);
            }

            this.clearDrag();
        },

        revealTop() {
            this.stacks.forEach((stack) => {
                if (stack.cards.length !== 0) {
                    stack.cards[stack.cards.length - 1].hidden = false;
                }
            });
        },

        clearDrag() {
            this.draggedStartTarget = null;
            this.dragged.cards = [];
        },

        next() {
            if (this.deck.cards.length > 0) {
                return this.deck.cards.pop();
            } else if (this.drop.cards.length > 0) {
                this.deck.cards = this.drop.cards;
                this.deck.cards.reverse();
                this.drop.cards = [];
                return this.next();
            } else {
                return null;
            }
        },

        nextDrop() {
            let card = this.next();
            if (card !== null) {
                this.drop.cards.push(card);
            }
        },

        deal() {
            console.info("[Klondike] dealing cards");
            let cards = KlondikeDeck();

            deck.cards = cards;
            for (let i = 0; i < this.stacks.length; i++) {
                let curStack = this.stacks[i];

                for (let j = 0; j < i + 1; j++) {
                    let card = this.next();
                    card.hidden = true;

                    curStack.cards.push(card);
                }

                curStack.cards[curStack.cards.length - 1].hidden = false;
            }
        },

        findClick(canvas, assetLoader, pos) {
            const cardNone = CardNone();
            const texture = assetLoader.get(cardNone.texture());
            const width = texture.width;
            const height = texture.height;

            const playfieldWidth = 7 * width + 6 * (width / 2);
            const playfieldHeight = height + height / 2 + 5 * height;
            const playfieldXOffset = canvas.dom.width / 2 - playfieldWidth / 2;
            const playfieldYOffset = canvas.dom.height / 2 - playfieldHeight / 2;

            const checkRect = (rect) => {
                return (
                    (pos.x >= rect.left && pos.x < rect.right) &&
                    (pos.y >= rect.top && pos.y < rect.bottom)
                );
            };

            const checkStack = (stack, stackPos) => {
                const rect = stack.bounds(assetLoader);
                const x = stackPos.x + playfieldXOffset;
                const y = stackPos.y + playfieldYOffset;

                return checkRect({
                    left: x + rect.left,
                    right: x + rect.right,
                    top: y + rect.top,
                    bottom: y + rect.bottom
                });
            };

            const checkSubindex = (stack, stackPos) => {
                const x = stackPos.x + playfieldXOffset;
                const y = stackPos.y + playfieldYOffset;

                let xoffset = width * stack.xoffset * stack.cards.length;
                let yoffset = height * stack.yoffset * stack.cards.length;
                for (let i = stack.cards.length - 1; i >= 0; i--) {
                    xoffset -= width * stack.xoffset;
                    yoffset -= height * stack.yoffset;

                    if (checkRect({
                        left: x + xoffset,
                        right: x + xoffset + width,
                        top: y + yoffset,
                        bottom: y + yoffset + height
                    })) {
                        return i;
                    }
                }

                return undefined;
            };

            // check deck and dropzone
            if (checkStack(this.deck, { x: 0, y: 0 })) {
                return { location: "deck" };
            }
            if (checkStack(this.drop, { x: width + width / 2, y: 0 })) {
                return { location: "drop" };
            }

            // check foundations
            let x = 3 * width + 3 * (width / 2);
            for (let i = 0; i < this.foundations.length; i++) {
                let foundation = this.foundations[i];
                let stackPos = { x, y: 0 };
                if (checkStack(foundation, stackPos)) {
                    return { location: "foundation", index: i };
                }

                x += width + width / 2;
            }

            // check stacks
            x = 0;
            let y = height + height / 2;
            for (let i = 0; i < this.stacks.length; i++) {
                let stack = this.stacks[i];
                let stackPos = { x, y };
                if (checkStack(stack, stackPos)) {
                    return { location: "stack", index: i, subindex: checkSubindex(stack, stackPos) };
                }

                x += width + width / 2;
            }

            return null;
        },

        draw(canvas, assetLoader) {
            const cardNone = CardNone();
            const texture = assetLoader.get(cardNone.texture());
            const width = texture.width;
            const height = texture.height;

            const playfieldWidth = 7 * width + 6 * (width / 2);
            const playfieldHeight = height + height / 2 + 5 * height;
            const playfieldXOffset = canvas.dom.width / 2 - playfieldWidth / 2;
            const playfieldYOffset = canvas.dom.height / 2 - playfieldHeight / 2;

            canvas.ctx.save();
            canvas.ctx.clearRect(0, 0, canvas.dom.width, canvas.dom.height);
            canvas.ctx.translate(playfieldXOffset, playfieldYOffset);

            // draw playmat
            canvas.ctx.save();
            canvas.ctx.beginPath();
            canvas.ctx.fillStyle = "#080";
            canvas.ctx.fillRect(-width, -height, playfieldWidth + 2 * width, playfieldHeight + 2 * height);
            canvas.ctx.restore();

            // draw deck and dropzone
            canvas.ctx.save();
            this.deck.draw(canvas, assetLoader);
            canvas.ctx.translate(width + width / 2, 0);
            this.drop.draw(canvas, assetLoader);
            canvas.ctx.restore();

            // draw foundations
            canvas.ctx.save();
            canvas.ctx.translate(3 * width + 3 * (width / 2), 0);
            this.foundations.forEach((foundation) => {
                foundation.draw(canvas, assetLoader);
                canvas.ctx.translate(width + width / 2, 0);
            });
            canvas.ctx.restore();

            // draw stacks
            canvas.ctx.save();
            canvas.ctx.translate(0, height + height / 2);
            this.stacks.forEach((stack) => {
                stack.draw(canvas, assetLoader);
                canvas.ctx.translate(width + width / 2, 0);
            });
            canvas.ctx.restore();

            // draw dragged fan
            if (this.dragged.cards.length > 0) {
                canvas.ctx.save();
                canvas.ctx.translate(this.draggedPos.x - playfieldXOffset, this.draggedPos.y - playfieldYOffset);
                this.dragged.draw(canvas, assetLoader);
                canvas.ctx.restore();
            }

            canvas.ctx.restore();
        }
    });
};

/* global */ engine = null;
/* global */ klondike = null;

const initialize = () => {
    engine = Engine();
    klondike = KlondikeField();

    engine.initialize((success) => {
        if (success) {
            console.info("[Initialize] finished loading assets");
            klondike.initialize(engine);
            engine.render();
        }
    });
};

window.addEventListener("DOMContentLoaded", initialize);

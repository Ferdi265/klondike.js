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
        draggedLastTarget: null,

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
                if (target.subindex !== undefined) {
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
                this.draggedLastTarget = null;

                if (target === null) {
                    return;
                }

                console.debug(`[Klondike] mousedown at ${targetDebug(target)}`);
                // TODO: start dragging if location is draggable
            });

            engine.canvas.dom.addEventListener("mousemove", (event) => {
                const pos = resolvePos(event);
                const target = this.findClick(engine.canvas, engine.assetLoader, pos);
                if (!targetEqual(target, this.draggedLastTarget)) {
                    this.draggedLastTarget = null;
                }

                // TODO: drag position update if dragging
            });

            engine.canvas.dom.addEventListener("mouseup", (event) => {
                const target = this.findClick(engine.canvas, engine.assetLoader, resolvePos(event));
                if (targetEqual(target, this.draggedLastTarget)) {
                    // click event
                    console.debug(`[Klondike] click event at ${targetDebug(target)}`);

                    if (target.location === "deck") {
                        this.nextDrop();
                    }
                } else {
                    // drop event
                    console.debug(`[Klondike] drag/drop event from ${targetDebug(this.draggedStartTarget)} to ${targetDebug(target)}`);
                    // TODO: handle drop
                }

            });
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

                let xoffset = 0;
                let yoffset = 0;
                for (let i = stack.cards.length - 1; i >= 0; i--) {
                    if (checkRect({
                        left: x + xoffset,
                        right: x + xoffset + width,
                        top: y + yoffset,
                        bottom: y + yoffset + height
                    })) {
                        return i;
                    }

                    xoffset += width * stack.xoffset;
                    yoffset += height * stack.yoffset;
                }

                return null;
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
            this.foundations.forEach((foundation, i) => {
                let stackPos = { x, y: 0 };
                if (checkStack(foundation, stackPos)) {
                    return { location: "foundation", index: i, subindex: checkSubindex(foundation, stackPos) };
                }

                x += width + width / 2;
            });

            // check stacks
            x = 0;
            let y = height + height / 2;
            this.stacks.forEach((stack, i) => {
                let stackPos = { x, y };
                if (checkStack(stack, stackPos)) {
                    return { location: "stack", index: i, subindex: checkSubIndex(stack, stackPos) };
                }

                x += width + width / 2;
            });

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
                canvas.ctx.translate(this.draggedPos.x, this.draggedPos.y);
                this.dragged.draw(canvs, assetLoader);
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
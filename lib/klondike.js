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

    return inherit(ClickArea(), {
        deck,
        drop,
        foundations,
        stacks,
        dragged,

        initialize(engine) {
            this.reset();
            this.register(engine);
            engine.drawObjects.push(this);
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

        handleClick(target) {
            if (target.location === "deck") {
                this.nextDrop();
            }

            this.clearDrag();
        },

        startDrag(target) {
            if (target === null) return false;

            if (target.location === "deck") {
                return true;
            } else if (target.location === "drop") {
                if (this.drop.cards.length > 0) {
                    this.dragged.cards.push(this.drop.cards.pop());
                    return true;
                }
            } else if (target.location === "foundation") {
                const foundation = this.foundations[target.index];
                if (foundation.cards.length > 0) {
                    this.dragged.cards.push(foundation.cards.pop());
                    return true;
                }
            } else if (target.location === "stack") {
                const stack = this.stacks[target.index];
                if (stack.cards.length === 0) return false;

                const substack = stack.cards.slice(target.subindex);
                if (substack.length === 0) return false;

                let last = substack[0];
                if (last.hidden) return false;

                for (let i = 1; i < substack.length; i++) {
                    const cur = substack[i];

                    if (cur.hidden) return false;
                    if (last.color() === cur.color()) return false;
                    if (last.value !== cur.value + 1) return false;

                    last = cur;
                }

                this.dragged.cards = substack;
                stack.cards = stack.cards.slice(0, target.subindex);
                return true;
            }

            return false;
        },

        updateDrag(_target) {
            // nothing to do here
        },

        stopDrag(target) {
            if (target === null) return false;
            if (this.dragged.cards.length === 0) return false;
            const bottom_card = this.dragged.cards[0];

            if (target.location === "foundation") {
                const suits = ["H", "C", "D", "S"];

                if (this.dragged.cards.length !== 1) return false;
                const index = suits.indexOf(bottom_card.suit);
                const foundation = this.foundations[index];

                if (foundation.cards.length === 0) {
                    if (bottom_card.value !== 1) return false;
                } else {
                    if (foundation.cards[foundation.cards.length - 1].value !== bottom_card.value - 1) return false;
                }

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
            const target = this.dragStartTarget;
            if (target === null) return;

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

        clearDrag() {
            this.dragged.cards = [];
            this.stacks.forEach((stack) => {
                if (stack.cards.length !== 0) {
                    stack.cards[stack.cards.length - 1].hidden = false;
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

        findClick(engine, pos) {
            const assetLoader = engine.assetLoader;
            const cardNone = CardNone();
            const texture = assetLoader.get(cardNone.texture());
            const width = texture.width;
            const height = texture.height;

            // check deck and dropzone
            if (this.deck.intersect(assetLoader, { x: 0, y: 0 }, pos)) {
                return { location: "deck", clickable: true };
            }
            if (this.drop.intersect(assetLoader, { x: width + width / 2, y: 0 }, pos)) {
                return { location: "drop" };
            }

            // check foundations
            let x = 3 * width + 3 * (width / 2);
            for (let i = 0; i < this.foundations.length; i++) {
                let foundation = this.foundations[i];
                let stackPos = { x, y: 0 };
                if (foundation.intersect(assetLoader, stackPos, pos)) {
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
                if (stack.intersect(assetLoader, stackPos, pos)) {
                    return { location: "stack", index: i, subindex: stack.intersectSubindex(assetLoader, stackPos, pos) };
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

            // update event offsets
            this.xoffset = playfieldXOffset;
            this.yoffset = playfieldYOffset;

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
                canvas.ctx.translate(this.dragPos.x, this.dragPos.y);
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

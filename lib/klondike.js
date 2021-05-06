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

    return inherit(null, {
        deck,
        drop,
        foundations,
        stacks,

        reset() {
            this.deck.cards = [];
            this.drop.cards = [];
            this.foundations.forEach((foundation) => {
                foundation.cards = [];
            });
            this.stacks.forEach((stack) => {
                stack.cards = [];
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

            canvas.ctx.restore();
        }
    });
};

/* global */ engine = null;
/* global */ klondike = null;

const initialize = () => {
    engine = Engine();
    klondike = KlondikeField();
    klondike.deal();

    engine.drawObjects.push(klondike);
    engine.initialize((success) => {
        if (success) {
            engine.render();
        }
    });
};

document.addEventListener("DOMContentLoaded", initialize);

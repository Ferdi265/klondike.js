const CardBack = (backcolor) => {
    if (backcolor === undefined) backcolor = defaultBackcolor;

    return ConstTexturedObject("B" + backcolor);
};

const CardEmpty = () => {
    return ConstTexturedObject("E");
};

const CardNone = () => {
    return ConstTexturedObject("N");
};

const Card = (value, suit, hidden, backcolor) => {
    if (hidden === undefined) hidden = false;
    if (backcolor === undefined) backcolor = defaultBackcolor;

    return inherit(TexturedObject(), {
        value,
        suit,
        hidden,
        backcolor,

        color() {
            if (this.suit === null) {
                return null;
            } else if (this.suit === "H" || this.suit === "D") {
                return "R";
            } else if (this.suit === "S" || this.suit === "C") {
                return "B";
            } else {
                throw Error(`[Card] invalid suit '${this.suit}'`);
            }
        },

        negativeValue() {
            if (this.value === null) {
                return 25;
            } else if (this.value === 1) {
                return 20;
            } else {
                return this.value;
            }
        },

        texture() {
            let assetName;
            if (this.hidden) {
                assetName = "B" + this.backcolor;
            } else if (this.value === null) {
                assetName = "J";
            } else {
                if (this.value === 1) {
                    assetName = "A";
                } else if (this.value === 11) {
                    assetName = "J";
                } else if (this.value === 12) {
                    assetName = "Q";
                } else if (this.value === 13) {
                    assetName = "K";
                } else {
                    assetName = String(this.value);
                }

                assetName += this.suit;
            }

            return assetName;
        },
    });
};

const CardStack = (backcolor, max, xoffset, yoffset) => {
    if (max === undefined) max = 5;
    if (xoffset === undefined) xoffset = 0;
    if (yoffset === undefined && xoffset === 0) yoffset = -1/16;
    if (yoffset === undefined && xoffset !== 0) yoffset = 0;

    const hidden = backcolor !== undefined;
    if (backcolor === undefined) backcolor = defaultBackcolor;

    return inherit(null, {
        cards: [],
        max,

        hidden,
        backcolor,

        xoffset,
        yoffset,

        bounds(assetLoader) {
            const cardNone = CardNone();
            const texture = assetLoader.get(cardNone.texture());
            const width = texture.width;
            const height = texture.height;

            const rect = {
                left: 0,
                top: 0,
                right: width,
                bottom: height
            };

            if (this.cards.length > 1) {
                if (this.xoffset < 0) {
                    rect.left += this.xoffset * (this.cards.length - 1);
                } else {
                    rect.right += this.xoffset * (this.cards.length - 1);
                }
                if (this.yoffset < 0) {
                    rect.top += this.yoffset * (this.cards.length - 1);
                } else {
                    rect.bottom += this.yoffset * (this.cards.length - 1);
                }
            }

            return rect;
        },

        draw(canvas, assetLoader) {
            const cardNone = CardNone();
            const cardBack = this.hidden ? CardBack(this.backcolor) : null;

            const texture = assetLoader.get(cardNone.texture());
            const width = texture.width;
            const height = texture.height;

            if (this.cards.length === 0) {
                cardNone.draw(canvas, assetLoader);
            } else {
                canvas.ctx.save();

                this.cards.slice(-this.max).forEach((card) => {
                    if (this.hidden) {
                        cardBack.draw(canvas, assetLoader);
                    } else {
                        card.draw(canvas, assetLoader);
                    }

                    canvas.ctx.translate(width * this.xoffset, height * this.yoffset);
                });

                canvas.ctx.restore();
            }
        }
    });
};

const CardFanHor = (backcolor, max, xoffset, yoffset) => {
    if (max === undefined) max = 13;
    if (xoffset === undefined) xoffset = 1/3;

    return CardStack(backcolor, max, xoffset, yoffset);
};

const CardFanVer = (backcolor, max, xoffset, yoffset) => {
    if (max === undefined) max = 13;
    if (xoffset === undefined) xoffset = 0;
    if (yoffset === undefined && xoffset === 0) yoffset = 1/5;

    return CardStack(backcolor, max, xoffset, yoffset);
};

/* global */ defaultBackcolor = "B";

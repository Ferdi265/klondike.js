const CardHoverFan = (max) => {
    return inherit(CardStack(undefined, max, 1/3, 0), {
        hoverIndex: null,

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

            let hoverOffset = 0;
            if (this.hoverIndex !== null && this.hoverIndex < this.cards.length - 1) {
                hoverOffset = 1;
            }

            if (this.cards.length > 1) {
                if (this.xoffset < 0) {
                    rect.left += this.xoffset * width * (this.cards.length - 1 + hoverOffset);
                } else {
                    rect.right += this.xoffset * width * (this.cards.length - 1 + hoverOffset);
                }
                if (this.yoffset < 0) {
                    rect.top += this.yoffset * height * (this.cards.length - 1 + hoverOffset);
                } else {
                    rect.bottom += this.yoffset * height * (this.cards.length - 1 + hoverOffset);
                }
            }

            return rect;
        },

        intersectSubindex(assetLoader, stackPos, pos) {
            const cardNone = CardNone();
            const texture = assetLoader.get(cardNone.texture());
            const width = texture.width;
            const height = texture.height;

            let hoverOffset = 0;
            if (this.hoverIndex !== null && this.hoverIndex < this.cards.length - 1) {
                hoverOffset = 1;
            }

            let xoffset = width * this.xoffset * (this.cards.length + hoverOffset);
            let yoffset = height * this.yoffset * (this.cards.length + hoverOffset);
            for (let i = this.cards.length - 1; i >= 0; i--) {
                const factor = this.hoverIndex === i ? 2 : 1;
                xoffset -= width * this.xoffset * factor;
                yoffset -= height * this.yoffset * factor;

                if (rectContains({
                    left: stackPos.x + xoffset,
                    right: stackPos.x + xoffset + width,
                    top: stackPos.y + yoffset,
                    bottom: stackPos.y + yoffset + height
                }, pos)) {
                    return i;
                }
            }

            return undefined;
        },

        draw(canvas, assetLoader, hoverCb) {
            if (hoverCb === undefined) hoverCb = () => {};
            const cardNone = CardNone();
            const cardBack = this.hidden ? CardBack(this.backcolor) : null;

            const texture = assetLoader.get(cardNone.texture());
            const width = texture.width;
            const height = texture.height;

            if (this.cards.length === 0) {
                cardNone.draw(canvas, assetLoader);
            } else {
                canvas.ctx.save();

                this.cards.slice(-this.max).forEach((card, i) => {
                    if (this.max < this.cards.length) {
                        i += this.cards.length - this.max;
                    }

                    if (this.hidden) {
                        cardBack.draw(canvas, assetLoader);
                    } else {
                        card.draw(canvas, assetLoader);
                    }

                    if (this.hoverIndex === i) {
                        hoverCb();
                    }

                    const factor = this.hoverIndex === i ? 2 : 1;
                    canvas.ctx.translate(width * this.xoffset * factor, height * this.yoffset * factor);
                });

                canvas.ctx.restore();
            }
        }
    });
};

const CardHighlightHoverFan = (max) => {
    return inherit(CardHoverFan(max), {
        highlightStyle: "#000",
        highlight: false,
        xmargin: 1/6,
        ymargin: 1/10,

        highlightBounds(assetLoader) {
            const cardNone = CardNone();
            const texture = assetLoader.get(cardNone.texture());
            const width = texture.width;
            const height = texture.height;

            const rect = this.bounds(assetLoader);
            return rectExpand(rect, this.xmargin * width, this.ymargin * height);
        },

        intersectHighlight(assetLoader, stackPos, pos) {
            const rect = this.highlightBounds(assetLoader);

            return rectContains({
                left: stackPos.x + rect.left,
                right: stackPos.x + rect.right,
                top: stackPos.y + rect.top,
                bottom: stackPos.y + rect.bottom
            }, pos);
        },

        draw(canvas, assetLoader, hoverCb) {
            if (this.highlight) {
                const rect = this.highlightBounds(assetLoader);
                canvas.ctx.save();
                canvas.ctx.strokeStyle = this.highlightStyle;
                canvas.ctx.setLineDash([10, 10]);
                canvas.ctx.strokeRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
                canvas.ctx.restore();
            }

            inherited(this, "draw")(canvas, assetLoader, hoverCb);
        }
    });
};

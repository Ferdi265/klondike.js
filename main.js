const inherit = (base, object) => {
    const instance = Object.create(base);

    Object.keys(object).forEach((key) => {
        instance[key] = object[key];
    });

    return instance;
};

const Asset = (name, path) => {
    return inherit(null, {
        name,
        path,
        dom: undefined,
        loaded: false,
        failed: false,
    });
};

const AssetLoader = () => {
    return inherit(null, {
        assets: {},

        has(assetName) {
            if (!Object.prototype.hasOwnProperty.call(this.assets, assetName)) return false;
            if (!this.assets[assetName].loaded) return false;

            return true;
        },

        get(assetName) {
            if (!Object.prototype.hasOwnProperty.call(this.assets, assetName)) {
                throw Error(`[AssetLoader] asset ${assetName} does not exist`);
            }
            if (!this.assets[assetName].loaded) {
                throw Error(`[AssetLoader] asset ${assetName} is not loaded`);
            }

            return this.assets[assetName].dom;
        },

        load(assets, callback, progressCallback) {
            if (progressCallback === undefined) progressCallback = () => {};

            let pending = assets.length;
            let loaded = 0;
            let failed = 0;

            const finishedCb = () => {
                if (failed == 0) {
                    console.info(`[AssetLoader] ${loaded} / ${loaded} assets loaded successfully`);
                    callback(true);
                } else {
                    console.info(`[AssetLoader] ${loaded} / ${failed + loaded} assets loaded successfully`);
                    callback(false);
                }
            };

            const successCb = (asset) => {
                console.debug(`[AssetLoader] loaded '${asset.name}'`);
                this.assets[asset.name] = asset;

                asset.loaded = true;
                loaded++;
                pending--;

                progressCallback(pending, loaded, failed);
                if (pending == 0) finishedCb();
            };

            const failCb = (asset) => {
                console.error(`[AssetLoader] failed to load '${asset.name}'`);

                asset.failed = true;
                failed++;
                pending--;

                progressCallback(pending, loaded, failed);
                if (pending == 0) finishedCb();
            };

            assets.forEach((asset) => {
                const dom = document.createElement("img");
                asset.dom = dom;
                dom.addEventListener("load", () => successCb(asset));
                dom.addEventListener("error", () => failCb(asset));
                dom.src = asset.path;
            });
        }
    });
};

const Canvas = () => {
    const dom = document.createElement("canvas");
    const ctx = dom.getContext("2d");

    return inherit(null, {
        dom,
        ctx,

        update_size() {
            this.dom.width = window.innerWidth;
            this.dom.height = window.innerHeight;
        },

        register() {
            document.body.innerHTML = "";
            document.body.appendChild(canvas.dom);

            document.body.addEventListener("resize", this.update_size);
        }
    });
};

const TexturedObject = () => {
    return inherit(null, {
        texture() {
            throw Error("[TexturedObject] tried to draw object without a texture");
        },

        draw(canvas, assetLoader) {
            let texture = assetLoader.get(this.texture());
            canvas.ctx.drawImage(texture, 0, 0);
        }
    });
};

const ConstTexturedObject = (assetName) => {
    return inherit(TexturedObject(), {
        texture() {
            return assetName;
        }
    });
};

const CardBack = (backcolor) => {
    return ConstTexturedObject("B" + backcolor);
};

const CardEmpty = () => {
    return ConstTexturedObject("E");
};

const CardNone = () => {
    return ConstTexturedObject("N");
};

const Card = (value, suit) => {
    return inherit(TexturedObject(), {
        value,
        suit,

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
            if (this.value === null) {
                assetName = "J";
            } else {
                if (this.value === 1) {
                    assetName = "A";
                } else if (this.value === 11) {
                    assetName = "J";
                } else if (this.value === 11) {
                    assetName = "Q";
                } else if (this.value === 11) {
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

const CardStack = (backcolor, xoffset, yoffset) => {
    if (xoffset === undefined) xoffset = 0;
    if (yoffset === undefined && xoffset === 0) yoffset = -1/16;
    if (yoffset === undefined && xoffset !== 0) yoffset = 0;

    return inherit(null, {
        cards: [],

        hidden: backcolor !== undefined,
        backcolor,

        xoffset,
        yoffset,

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

                this.cards.slice(-5).forEach((card) => {
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

const CardFan = (backcolor) => {
    return CardStack(backcolor, 1/3, 0);
};

/* global */ canvas = null;
/* global */ assetLoader = null;
/* global */ assetList = [];

const populateAssets = () => {
    const suits = ["S", "C", "H", "D"];
    const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const other = ["J", "E", "N", "BB", "BR"];

    const addAsset = (name) => {
        assetList.push(Asset(name, `assets/${name}.svg`));
    };

    suits.forEach((suit) => {
        values.forEach((value) => {
            addAsset(value + suit);
        });
    });

    other.forEach(addAsset);
};

const initialize = () => {
    canvas = Canvas();
    canvas.update_size();
    canvas.register();

    assetLoader = AssetLoader();
    populateAssets();
    assetLoader.load(assetList, (success) => {
        if (success) {
            console.info("[Initialize] finished loading assets");
        } else {
            console.error("[Initialize] error loading assets");
        }
    });
};

window.addEventListener("DOMContentLoaded", initialize);

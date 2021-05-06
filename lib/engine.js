const Canvas = () => {
    const dom = document.createElement("canvas");
    const ctx = dom.getContext("2d");

    return inherit(null, {
        dom,
        ctx,

        update_size() {
            this.dom.width = window.innerWidth;
            this.dom.height = window.innerHeight;
            console.info(`[Canvas] updated size to ${this.dom.width} x ${this.dom.height}`);
        },

        register() {
            console.info("[Canvas] listening for resize events");
            document.body.innerHTML = "";
            document.body.appendChild(this.dom);

            window.addEventListener("resize", () => this.update_size());
        }
    });
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

const Engine = () => {
    return inherit(null, {
        canvas: null,
        assetLoader: null,
        assetList: null,
        renderEnabled: false,
        drawObjects: [],

        initialize(callback) {
            this.initializeCanvas();
            this.loadAssets(callback);
        },

        render() {
            this.renderEnabled = true;

            const renderFrame = () => {
                this.drawObjects.forEach((object) => {
                    object.draw(this.canvas, this.assetLoader);
                });

                if (this.drawObjects.length === 0) this.renderEnabled = false;
                if (this.renderEnabled) window.requestAnimationFrame(renderFrame);
            };

            window.requestAnimationFrame(renderFrame);
        },

        initializeCanvas() {
            console.info("[Engine] creating canvas");
            this.canvas = Canvas();
            this.canvas.update_size();
            this.canvas.register();
        },

        loadAssets(callback) {
            if (callback === undefined) callback = () => {};

            console.info("[Engine] loading assets");
            this.populateAssets();
            this.assetLoader = AssetLoader();
            this.assetLoader.load(this.assetList, (success) => {
                if (success) {
                    console.info("[Engine] finished loading assets");
                } else {
                    console.error("[Engine] error loading assets");
                }

                callback(success);
            });
        },

        populateAssets() {
            const suits = ["S", "C", "H", "D"];
            const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
            const other = ["J", "E", "N", "BB", "BR"];

            this.assetList = [];

            const addAsset = (name) => {
                this.assetList.push(Asset(name, `assets/${name}.svg`));
            };

            suits.forEach((suit) => {
                values.forEach((value) => {
                    addAsset(value + suit);
                });
            });

            other.forEach(addAsset);
        }
    });
};

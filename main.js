const Asset = (name, path) => {
    const self = {
        name,
        path,
        dom: undefined,
        loaded: false,
        failed: false,
    };

    return self;
};

const AssetLoader = () => {
    const self = {
        assets: {},

        load: (assets, callback) => {
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
                self.assets[asset.name] = asset;

                asset.loaded = true;
                loaded++;
                pending--;
                if (pending == 0) finishedCb();
            };

            const failCb = (asset) => {
                console.error(`[AssetLoader] failed to load '${asset.name}'`);

                asset.failed = true;
                failed++;
                pending--;
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
    };

    return self;
}

const Canvas = () => {
    const dom = document.createElement("canvas");
    const ctx = dom.getContext("2d");

    const self = {
        dom,
        ctx,

        update_size: () => {
            self.dom.width = window.innerWidth;
            self.dom.height = window.innerHeight;
        },

        register: () => {
            document.body.innerHTML = "";
            document.body.appendChild(canvas.dom);

            document.body.addEventListener("resize", self.update_size);
        }
    };

    return self;
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

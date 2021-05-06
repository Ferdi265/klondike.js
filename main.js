/* global */ engine = null;

const initialize = () => {
    engine = Engine();

    engine.initialize((success) => {
        if (success) {
            console.info("[Initialize] finished loading assets");
        } else {
            console.error("[Initialize] error loading assets");
        }
    });
};

window.addEventListener("DOMContentLoaded", initialize);

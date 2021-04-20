const canvas_create = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    return {
        dom: canvas,
        ctx: ctx
    };
};

const canvas_update_size = (canvas) => {
    canvas.dom.width = window.innerWidth;
    canvas.dom.height = window.innerHeight;
};

const canvas_register = (canvas) => {
    document.body.innerHTML = "";
    document.body.appendChild(canvas.dom);

    document.addEventListener("resize", () => canvas_update_size(canvas));
};

/* global */ canvas = null;

const initialize = () => {
    canvas = canvas_create();
    canvas_update_size(canvas);
    canvas_register(canvas);
};

window.addEventListener("DOMContentLoaded", () => initialize());

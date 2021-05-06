const debug = true;

const Listeners = (target) => {
    const private = {
        target,
        handlers: []
    };

    const self = {
        register: (event, func, capture) => {
            if (capture === undefined) capture = false;

            private.handlers.push({ event, func, capture });
            private.target.addEventListener(event, func, capture);
        },
        deregister: (event, func, capture) => {
            private.handlers = private.handlers.filter((handler) => {
                if (event !== undefined && event !== handler.event) return true;
                if (func !== undefined && func !== handler.func) return true;
                if (capture !== undefined && capture !== handler.capture) return true;

                private.target.removeEventListener(handler.event, handler.func, handler.capture);
                return false;
            });
        },
    };

    if (debug) self._private = private;
    return self;
};

const Canvas = () => {
    const dom = document.createElement("canvas");
    const ctx = dom.getContext("2d");

    const private = {
        listeners: Listeners(dom)
    };

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

            private.listeners.register("resize", self.update_size);
        },

        deregister: () => {
            private.listeners.deregister();
        }
    };

    if (debug) self._private = private;
    return self;
};

/* global */ canvas = null;

const initialize = () => {
    canvas = Canvas();
    canvas.update_size();
    canvas.register();
};

window.addEventListener("DOMContentLoaded", initialize);

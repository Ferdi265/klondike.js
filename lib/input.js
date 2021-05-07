const ClickArea = (xoffset, yoffset) => {
    if (xoffset === undefined) xoffset = 0;
    if (yoffset === undefined) yoffset = 0;

    return inherit(null, {
        xoffset,
        yoffset,

        dragPos: { x: 0, y: 0 },
        dragStartTarget: null,
        dragActive: false,
        dragClick: false,

        register(engine) {
            const targetEqual = (target1, target2) => {
                if (target1 === target2) return true;
                if (target1 === null && target2 !== null) return false;
                if (target2 === null && target1 !== null) return false;

                return (
                    target1.location === target2.location &&
                    target1.index === target2.index &&
                    target1.subindex == target2.subindex
                );
            };

            const targetDebug = (target) => {
                if (target === null) {
                    return "nowhere";
                } else if (target.subindex !== undefined) {
                    return `${target.location}:${target.index}:${target.subindex}`;
                } else if (target.index !== undefined) {
                    return `${target.location}:${target.index}`;
                } else {
                    return `${target.location}`;
                }
            };

            const resetDrag = () => {
                this.dragPos = { x: 0, y: 0 };
                this.dragStartTarget = null;
                this.dragActive = false;
                this.dragClick = false;
            };

            const startDragEvent = (event) => {
                if (this.dragActive) {
                    this.cancelDrag();
                    resetDrag();
                }

                const pos = this.resolvePos(event);
                const target = this.findClick(engine, pos);
                if (target === null) {
                    return;
                }

                this.dragPos = pos;
                this.dragStartTarget = target;
                this.dragActive = true;
                this.dragClick = false;

                console.debug(`[ClickArea] starting drag at ${targetDebug(target)}`);

                event.preventDefault();

                if (target.clickable) {
                    this.dragClick = true;
                }

                if (!this.startDrag(target)) {
                    console.debug(`[ClickArea] cancelling invalid drag at ${targetDebug(target)}`);
                    resetDrag();
                }
            };

            const updateDragEvent = (event) => {
                if (!this.dragActive) return;
                event.preventDefault();

                const pos = this.resolvePos(event);
                const target = this.findClick(engine, pos);
                this.dragPos = pos;

                if (this.dragClick && !targetEqual(target, this.dragStartTarget)) {
                    this.dragClick = false;
                }

                this.updateDrag(target);
            };

            const stopDragEvent = (event) => {
                if (!this.dragActive) return;
                const pos = this.resolvePos(event);
                const target = this.findClick(engine, pos);
                event.preventDefault();

                if (this.dragClick && targetEqual(target, this.dragStartTarget)) {
                    console.debug(`[ClickArea] click at ${targetDebug(target)}`);

                    if (target.clickable) {
                        this.handleClick(target);
                    }
                } else {
                    // drag/drop event
                    console.debug(`[ClickArea] drag/drop from ${targetDebug(this.dragStartTarget)} to ${targetDebug(target)}`);
                    if (!this.stopDrag(target)) {
                        this.cancelDrag();
                    }
                }

                resetDrag();
            };

            engine.canvas.dom.addEventListener("mousedown", startDragEvent);
            engine.canvas.dom.addEventListener("touchstart", startDragEvent);
            engine.canvas.dom.addEventListener("mousemove", updateDragEvent);
            engine.canvas.dom.addEventListener("touchmove", updateDragEvent);
            engine.canvas.dom.addEventListener("mouseup", stopDragEvent);
            engine.canvas.dom.addEventListener("touchend", stopDragEvent);
        },

        resolvePos(event) {
            if (event.clientX === undefined && event.targetTouches[0] === undefined) {
                return this.dragPos;
            }

            const rect = engine.canvas.dom.getBoundingClientRect();
            const x = event.clientX || event.targetTouches[0].pageX;
            const y = event.clientY || event.targetTouches[0].pageY;
            return {
                x: x - rect.left - this.xoffset,
                y: y - rect.top - this.yoffset
            };
        },

        findClick(_engine, _pos) {
            throw Error("[ClickArea] findClick implementation missing");
        },

        handleClick(_target) {
            throw Error("[ClickArea] handleClick implementation missing");
        },

        startDrag(_target) {
            throw Error("[ClickArea] startDrag implementation missing");
        },

        updateDrag(_target) {
            throw Error("[ClickArea] updateDrag implementation missing");
        },

        stopDrag(_target) {
            throw Error("[ClickArea] stopDrag implementation missing");
        },

        cancelDrag() {
            throw Error("[ClickArea] cancelDrag implementation missing");
        },
    });
};

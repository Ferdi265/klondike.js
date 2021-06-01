const inherit = (base, object) => {
    const instance = Object.create(base);

    Object.keys(object).forEach((key) => {
        instance[key] = object[key];
    });

    return instance;
};

const inherited = (inst, method) => {
    return Object.getPrototypeOf(inst)[method].bind(inst);
};

const shuffle = (array) => {
    let i = array.length - 1;
    while (i > 0) {
        const j = Math.floor(Math.random() * (i + 1));

        const tmp = array[j];
        array[j] = array[i];
        array[i] = tmp;

        i--;
    }
};

const rectContains = (rect, pos) => {
    return (
        (pos.x >= rect.left && pos.x < rect.right) &&
        (pos.y >= rect.top && pos.y < rect.bottom)
    );
};

const rectExpand = (rect, xmargin, ymargin) => {
    return {
        left: rect.left - xmargin,
        right: rect.right + xmargin,
        top: rect.top - ymargin,
        bottom: rect.bottom + ymargin
    };
};

const posOffset = (posA, posB) => {
    return {
        x: posB.x - posA.x,
        y: posB.y - posA.y
    };
};

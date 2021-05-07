const inherit = (base, object) => {
    const instance = Object.create(base);

    Object.keys(object).forEach((key) => {
        instance[key] = object[key];
    });

    return instance;
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

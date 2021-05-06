const inherit = (base, object) => {
    const instance = Object.create(base);

    Object.keys(object).forEach((key) => {
        instance[key] = object[key];
    });

    return instance;
};


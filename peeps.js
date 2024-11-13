const peeps = {
    register: (name, instructions) => {
        const peep = { name: name, instructions: instructions };

        peeps[name] = peep;
        return  peep;
    }
}
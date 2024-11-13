const peeps = {
    register: (name, instructions, voice, handler) => {
        instructions = handler ? ('Respond with JSON.\n' + instructions + '\nProvide key "reply" telling what you did in a lighthearted way.') :
        (instructions + ' Keep your answers brief. ' +
        'For rendering mathematical expressions, use LaTex with backslash square brackets, \\[ ... \\] ' +
        'for display-style and \\( ... \\) for inline -- no dollar signs. ' + 
        'Do not escape the backslashes.');

        const peep = { name: name, instructions: instructions, voice: voice || 'none', handler: handler };

        peeps[name] = peep;
        return  peep;
    }
}

peeps.register('Homer',
`
characters (object, keyed by name (preserve spaces if any), of voice(only if requested) and instructions),

The instructions address character as "you".
Instruct the character as to its behavior. It will be a gpt system instruction.

Voices alloy, shimmer, nova are for women and echo, fable(british), onyx for men.
`, 'none', o => {
    if (o.characters) {
        Object.entries(o.characters).forEach(([name, character]) => {
            character.instructions += ' Pretend your name is ' + name + '. ' +
                'Never refer to yourself by name, unless directly asked your name. ' +
                'Never refer to yourself as an AI. This is role playing and you must remain in character.';

            peeps.register(name, character.instructions, character.voice);
        });
    }
});


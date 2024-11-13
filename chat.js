chat = {
    messages: [],
    peep: peeps.register('ai', 'You are a helpful assistant.'),

    prompt: async prompt => {
        chat.waiting = true;

        {
            const name = prompt.split(',')[0];
            const p = peeps[name];

            if (p) {
                chat.peep = p;
            }
        }

        const peep = chat.peep;

        function post(text) {
            const name = document.getElementById('chat').children.length % 2 ? peep.name : 'me';
            const title = document.createElement('span');

            title.innerHTML = name
            title.classList.add('name');

            const top = document.createElement('div');

            top.append(title);

            if (name !== 'me') {
                const span = text => {
                    const span = document.createElement('span');
                    span.innerHTML = text;
                    return span;
                };
            }

            const bottom = document.createElement('div');
            bottom.innerHTML = text;

            const post = document.createElement('div');
            post.append(top, bottom);
            post.classList.add('post');
            document.getElementById('chat').appendChild(post);

            post.scrollIntoView({ behavior: 'smooth' });
        }

        post(prompt);

        chat.messages.push(prompt);

        function respond(response) {
            chat.messages.push(response);
            response = response.replace(/\\/g, '\\\\');  // so markdown won't trample LaTex
            response = marked.parse(response);
            post(response);
            MathJax.typesetPromise();
            chat.waiting = false;
        }

        const instructions = peep.instructions;
        const headers = { 'Content-Type': 'application/json' };
        const msgs = (chat.messages).map((msg, i) => ({ role: i % 2 ? 'assistant' : 'user', content: msg }));


        msgs.unshift({ role: 'system', content: instructions });

        await fetch('/openai/v1/chat/completions', {
            method: 'POST',
            headers:  headers,
            body: JSON.stringify({
                messages: msgs,
                model: 'gpt-4o-mini',
                temperature: 0,
                response_format: { type: 'text' }
            })
        })
        .then(response => response.json())
        .then(o => {
            response(o.choices[0].message.content);
        });
    },

    clear: () => {
        document.getElementById('chat').innerHTML = "";
        chat.messages = [];
    },

    paste: () => {
        navigator.clipboard.readText()
        .then(prompt => {
            if (prompt !== '') {
                chat.prompt(prompt);
            }
        })
    },

    redo: () => {
        const m = chat.messages;

        if (m.length > 1) {
            const prompt = m[m.length - 2];
            const div = document.getElementById('chat');

            div.removeChild(div.lastChild);
            div.removeChild(div.lastChild);
            m.pop();
            m.pop();

            chat.prompt(prompt);
        }
    },

    back: () => {
        const m = chat.messages;

        if (m.length > 1) {
            const div = document.getElementById('chat');

            div.removeChild(div.lastChild);
            div.removeChild(div.lastChild);
            m.pop();
            m.pop();

            if (m.length > 1) {
                chat.peep = peeps[div.lastChild.querySelector('.name').innerHTML];
            }
        }
    }
}
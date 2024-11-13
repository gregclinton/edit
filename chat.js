chat = {
    messages: [],
    peep: peeps.register('Max', 'You are a helpful assistant.'),

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
                    span.classList.add('settings')
                    return span;
                };

                top.append(span(settings.model), span(settings.temperature));
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

        if (peep.handler && peep.name === prompt.split(',')[0]) {
            // blot out the agent's name, so as not to confuse him
            prompt = prompt.charAt(peep.name.length + 2).toUpperCase() + prompt.slice(peep.name.length + 3);
        }

        chat.messages.push(prompt);

        function respond(response) {
            if (peep.voice !== 'none') {
                player.tts(response, peep.voice);
            }
            chat.messages.push(response);
            response = response.replace(/\\/g, '\\\\');  // so markdown won't trample LaTex
            response = marked.parse(response);
            post(response);
            MathJax.typesetPromise();
            chat.waiting = false;
        }

        const instructions = peep.instructions;
        const headers = { 'Content-Type': 'application/json' };

        switch (peep.handler ? 'gpt' : settings.model) {
            case 'gpt': {
                // https://platform.openai.com/docs/api-reference/introduction

                const msgs = (peep.handler ? [prompt] : chat.messages).map((msg, i) => ({ role: i % 2 ? 'assistant' : 'user', content: msg }));


                msgs.unshift({ role: 'system', content: instructions });

                await fetch('/openai/v1/chat/completions', {
                    method: 'POST',
                    headers:  headers,
                    body: JSON.stringify({
                        messages: msgs,
                        model: 'gpt-4o',
                        temperature: peep.handler ? 0 : 2.0 * settings.temperature / 100.0,
                        response_format: { type: peep.handler ? 'json_object' : 'text' }
                    })
                })
                .then(response => response.json())
                .then(o => {
                    const content = o.choices[0].message.content;

                    if (peep.handler) {
                        const o = JSON.parse(content);

                        peep.handler(o);
                        respond(o.reply || 'Done.');
                    } else {
                        respond(content);
                    }
                });
                break;
            }

            case 'claude': {
                // https://docs.anthropic.com/claude/reference/messages_post

                const msgs = chat.messages.map((msg, i) => ({ role: i % 2 ? 'assistant' : 'user', content: msg }));
                headers['anthropic-version'] = '2023-06-01';

                await fetch('/anthropic/v1/messages', {
                    method: 'POST',
                    headers:  headers,
                    body: JSON.stringify({
                        system: instructions,
                        messages: msgs,
                        model: 'claude-3-5-sonnet-20240620',
                        temperature: 1.0 * settings.temperature / 100.0,
                        max_tokens: 1000
                    })
                })
                .then(response => response.json())
                .then(o => respond(o.content[0].text));
                break;
            }

            case 'gemini': {
                // https://ai.google.dev/api/rest
                // https://ai.google.dev/tutorials/rest_quickstart

                const text = instructions + chat.messages.map((msg, i) => (i % 2  ? 'response: ' :  'prompt: ') +  msg ).join('\n') + '\nresponse: ';

                await fetch('/gemini/v1beta/models/gemini-pro:generateContent', {
                    method: 'POST',
                    headers:  headers,
                    body: JSON.stringify({ contents: [{parts: [{text: text}]}]})
                })
                .then(response => response.json())
                .then(o => respond(o.candidates[0].content.parts[0].text));
                break;
            }

            case 'mistral': {
                // https://docs.mistral.ai/api/

                const msgs = chat.messages.map((msg, i) => ({ role: i % 2  ? 'assistant' : 'user', content: msg }));

                await fetch('/mistral/v1/chat/completions', {
                    method: 'POST',
                    headers:  headers,
                    body: JSON.stringify({
                        messages: msgs,
                        model: 'mistral-large-latest'
                    })
                })
                .then(response => response.json())
                .then(o => respond(o.choices[0].message.content));
                break;
            }
        }
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
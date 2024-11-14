chat = {
    messages: [],

    prompt: async prompt => {
        chat.waiting = true;

        function post(text) {
            const name = document.getElementById('chat').children.length % 2 ? 'ai' : 'me';
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

        const headers = { 'Content-Type': 'application/json' };
        const msgs = (chat.messages).map((msg, i) => ({ role: i % 2 ? 'assistant' : 'user', content: msg }));

        await fetch('/editor/prompt', {
            method: 'POST',
            headers:  headers,
            body: JSON.stringify({
                prompt: prompt
            })
        })
        .then(response => response.json())
        .then(o => {
            chat.messages.push(o.answer);
            post(marked.parse(o.answer));
            chat.waiting = false;
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
    }
}
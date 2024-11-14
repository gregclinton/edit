chat = {
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
            Prism.highlightAll();

            post.scrollIntoView({ behavior: 'smooth' });
        }

        post(prompt);

        await fetch('/editor/messages', {
            method: 'POST',
            headers:  { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt
            })
        })
        .then(response => response.json())
        .then(o => {
            post(marked.parse(o.content));
            o = o.response_metadata;
            console.log(o.token_usage.total_tokens);
            console.log(o.model_name);
            chat.waiting = false;
        });
    },

    clear: () => {
        document.getElementById('chat').innerHTML = "";
        fetch('/editor/messages', { method: 'DELETE' });
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

chat.clear();
let model = '';
let tokens = 0;

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
                    span.classList.add('settings')
                    return span;
                };

                top.append(span(model), span(tokens + ' tokens'));
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
            metadata = o.response_metadata;
            model = metadata.model_name;
            tokens = metadata.token_usage.total_tokens;
            post(marked.parse(o.content));
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
};

chat.clear();
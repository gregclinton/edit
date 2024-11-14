const chat = {
    prompt: async prompt => {
        chat.waiting = true;

        function post(text, output) {
            const name = document.getElementById('chat').children.length % 2 ? 'ai' : 'me';
            const title = document.createElement('span');

            title.innerHTML = name
            title.classList.add('name');

            const top = document.createElement('div');

            top.append(title);

            if (output) {
                const span = text => {
                    const span = document.createElement('span');
                    span.innerHTML = text;
                    span.classList.add('settings')
                    return span;
                };

                top.append(
                    span(output.model), 
                    span(output.temperature + '°'),
                    span(output.tokens.in + ' in'),
                    span(output.tokens.out + ' out'),
                    span(output.tokens.all + ' all')
                );
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
            post(marked.parse(o.content), o);
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
    },

    redo: () => {
        const div = document.getElementById('chat');

        if (div.children.length > 2) {
            div.removeChild(div.lastChild);
            div.removeChild(div.lastChild);

            chat.prompt(div.lastChild.innerHTML);
        }

        fetch('/editor/messages', { method: 'DELETE' });
    },

    back: () => {
        const div = document.getElementById('chat');

        if (div.children.length > 2) {
            div.removeChild(div.lastChild);
            div.removeChild(div.lastChild);
        } 

        fetch('/editor/messages/last', { method: 'DELETE' });
    }   
};

chat.clear();
const chatDiv = document.getElementById('chat');
const input = document.getElementById('input');
const ws = new WebSocket("ws://localhost:8000/chat");

/* global Terminal */

// Utilities
const addKeyDownListener = (eventKey, target, onKeyDown) => {
    target.addEventListener('keydown', e => {
        if (e.key === eventKey) {
            onKeyDown();

            e.preventDefault();
        }
    });
};

const scrollToPageEnd = () => {
    window.scrollTo(0, document.body.scrollHeight);
};

// User interface
const viewRefs = {
    input: document.getElementById('input'),
    output: document.getElementById('output-wrapper')
};

// 'text-output', 'error-output', 'header-output'
const createOutputDiv = (className, textContent) => {
    const div = document.createElement('div');

    div.className = className;
    div.appendChild(document.createTextNode(textContent));

    return div;
};

const getInput = () => viewRefs.input.value;

const setInput = (input) => {
    viewRefs.input.value = input;
};

const clearInput = () => {
    setInput('');
};

// Execution

addKeyDownListener('Enter', viewRefs.input, () => {
    const commandStr = getInput();
    ws.send(commandStr);
    viewRefs.output.append(createOutputDiv('header-output', commandStr));
    scrollToPageEnd();
    clearInput();
});

ws.onmessage = (event) => {
    const content = event.data;
    const lastChild = viewRefs.output.lastChild;
    if (lastChild == null || lastChild.className != 'text-output')
        viewRefs.output.append(createOutputDiv('text-output', content));
    else
        lastChild.textContent += content;
    scrollToPageEnd();
};

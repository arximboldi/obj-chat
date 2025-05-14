const chatDiv = document.getElementById('chat');
const input = document.getElementById('input');
const ws = new WebSocket("ws://localhost:8000/chat");


/* global Terminal */


// User interface
const viewRefs = {
    main: document.getElementById('main-view'),
    input: document.getElementById('input'),
    output: document.getElementById('output-wrapper')
};

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
    viewRefs.main.scrollTo(0, viewRefs.main.scrollHeight);
};

// 'text-output', 'error-output', 'header-output'
const createOutputDiv = (className, textContent) => {
    const div = document.createElement('div');

    div.className = className;
    div.appendChild(document.createTextNode(textContent));

    return div;
};

const getInput = () => viewRefs.input.textContent;

const setInput = (input) => {
    viewRefs.input.textContent = input;
};

const clearInput = () => {
    setInput('');
};

// Execution

viewRefs.input.addEventListener('blur', (event) => {
    // Set the focus back on the input
    setTimeout(() => viewRefs.input.focus(), 0);
});

// Optionally, set focus on page load
window.addEventListener('load', () => {
    setTimeout(() => viewRefs.input.focus(), 0);
});

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

// add fake caret
// https://phuoc.ng/collection/mirror-a-text-area/create-your-own-custom-cursor-in-a-text-area/
document.addEventListener('DOMContentLoaded', () => {
    const containerEle = document.getElementById('input-container');
    const input = document.getElementById('input');

    const mirroredEle = document.createElement('div');
    mirroredEle.textContent = input.textContent;
    mirroredEle.classList.add('input-mirror');
    containerEle.prepend(mirroredEle);

    const inputStyles = window.getComputedStyle(input);
    [
        'border',
        'boxSizing',
        'fontFamily',
        'fontSize',
        'fontWeight',
        'letterSpacing',
        'lineHeight',
        'padding',
        'textDecoration',
        'textIndent',
        'textTransform',
        'whiteSpace',
        'wordSpacing',
        'wordWrap',
    ].forEach((property) => {
        mirroredEle.style[property] = inputStyles[property];
    });
    mirroredEle.style.borderColor = 'transparent';

    const parseValue = (v) => v.endsWith('px') ? parseInt(v.slice(0, -2), 10) : 0;
    const borderWidth = parseValue(inputStyles.borderWidth);

    const ro = new ResizeObserver(() => {
        mirroredEle.style.width = `${input.clientWidth + 2 * borderWidth}px`;
        mirroredEle.style.height = `${input.clientHeight + 2 * borderWidth}px`;
    });
    ro.observe(input);

    input.addEventListener('scroll', () => {
        mirroredEle.scrollTop = input.scrollTop;
    });

    const handleSelectionChange = () => {
        if (document.activeElement !== input) {
            return;
        }
        const cursorPos = input.selectionStart;
        const textBeforeCursor = input.textContent.substring(0, cursorPos);
        const textAfterCursor = input.textContent.substring(cursorPos);

        const pre = document.createTextNode(textBeforeCursor);
        const post = document.createTextNode(textAfterCursor);
        const caretEle = document.createElement('span');
        caretEle.classList.add('input-cursor');
        caretEle.innerHTML = '&nbsp;&nbsp;';

        mirroredEle.innerHTML = '';
        mirroredEle.append(pre, caretEle, post);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
});

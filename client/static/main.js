function getWebSocketUrl(siblingFileName) {
    const url = new URL(window.location.href);
    url.protocol = url.protocol == 'https:' ? "wss:" : "ws:";
    url.pathname = url.pathname.replace(/[^/]*$/, siblingFileName);
    return url.toString();
}

const ws = new WebSocket(getWebSocketUrl("chat"));

/* global Terminal */

// User interface
const READY_TOKEN = "%{OBJOS-READY}%";
const CLEAR_TOKEN = "%{OBJOS-CLEAR}%";

const viewRefs = {
    main: document.getElementById('main-view'),
    input: document.getElementById('input'),
    inputWrapper: document.getElementById('input-wrapper'),
    spinner: document.getElementById('spinner'),
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

// Set input visibility based on readiness
const setReady = (ready) => {
    viewRefs.inputWrapper.style.display = ready ? "flex" : "none";
    viewRefs.spinner.style.display = !ready ? "block" : "none";
    if (ready) setTimeout(() => viewRefs.input.focus(), 1);
};
setReady(false); // initial value

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
    handleSelectionChange();
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

document.body.addEventListener('click', () => {
    setTimeout(() => viewRefs.input.focus(), 0);
});

addKeyDownListener('Enter', viewRefs.input, () => {
    const commandStr = getInput();
    ws.send(commandStr);
    viewRefs.output.append(createOutputDiv('header-output', commandStr));
    scrollToPageEnd();
    clearInput();
    setReady(false);
});

ws.onmessage = (event) => {
    const lastChild = viewRefs.output.lastChild;
    const content = event.data;
    if (content === READY_TOKEN) {
        setReady(true);
    } else if (content === CLEAR_TOKEN) {
        if (lastChild != null && lastChild.className == 'text-output')
            lastChild.textContent = '';
    } else {
        if (lastChild == null || lastChild.className != 'text-output')
            viewRefs.output.append(createOutputDiv('text-output', content));
        else
            lastChild.textContent += content;
    }
    scrollToPageEnd();
};

// add fake caret
// https://phuoc.ng/collection/mirror-a-text-area/create-your-own-custom-cursor-in-a-text-area/
const handleSelectionChange = () => {
    const input = viewRefs.input;
    const mirror = document.getElementById('input-mirror');
    const selection = document.getSelection();

    if (document.activeElement !== input) {
        return;
    }

    const cursorPos = selection.focusOffset;
    console.log("cusor:", cursorPos);
    const textBeforeCursor = input.textContent.substring(0, cursorPos);
    const textAfterCursor = input.textContent.substring(cursorPos);

    const pre = document.createTextNode(textBeforeCursor);
    const post = document.createTextNode(textAfterCursor);
    const caret = document.createElement('span');
    caret.classList.add('input-cursor');
    caret.innerHTML = '&#9610;';
    caret.style.marginLeft = textAfterCursor.length == 0 ? "0.075em" : "-0.025em";

    mirror.innerHTML = '';
    mirror.append(pre, caret, post);
    console.log("selection change!");
};

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('input-container');
    const input = document.getElementById('input');

    const mirror = document.createElement('div');
    mirror.id = 'input-mirror';
    mirror.textContent = input.textContent;
    container.prepend(mirror);

    const updateMirror = () => {
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
            mirror.style[property] = inputStyles[property];
        });
        const parseValue = (v) => v.endsWith('px') ? parseInt(v.slice(0, -2), 10) : 0;
        const borderWidth = parseValue(inputStyles.borderWidth);
        mirror.style.borderColor = 'transparent';
        mirror.style.width = `${input.clientWidth + 2 * borderWidth}px`;
        mirror.style.height = `${input.clientHeight + 2 * borderWidth}px`;
    };

    const ro = new ResizeObserver(updateMirror);
    ro.observe(input);

    input.addEventListener('scroll', () => {
        mirror.scrollTop = input.scrollTop;
    });

    document.addEventListener('selectionchange', handleSelectionChange);
});

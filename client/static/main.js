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
const focusInput = () => {
    if (document.activeElement !== viewRefs.input) {
        setTimeout(() => viewRefs.input.focus(), 0);
    }
}

const setReady = (ready, isError) => {
    viewRefs.inputWrapper.style.opacity = ready ? "1" : "0";
    viewRefs.inputWrapper.style.height = ready ? null : "0";
    viewRefs.spinner.style.visibility = !ready ? "visible" : "hidden";
    viewRefs.spinner.style.height = !ready ? null : "0";
    viewRefs.input.textContent = '';
    focusInput();
};

const setError = (error) => {
    var color = error ? "tomato" : "#53eb9b";
    document.documentElement.style.setProperty('--accent-color', 'tomato');
    viewRefs.inputWrapper.style.opacity = !error ? "1" : "0";
    viewRefs.inputWrapper.style.height = !error ? null : "0";
    viewRefs.spinner.style.visibility = !error ? "visible" : "hidden";
    viewRefs.spinner.style.height = !error ? null : "0";
    if (!error) {
        viewRefs.input.textContent = '';
        focusInput();
    }
};

const scrollToPageEnd = () => {
    setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight);
        viewRefs.main.scrollTo(0, viewRefs.main.scrollHeight);
    }, 0)
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
    focusInput();
});

// Optionally, set focus on page load
window.addEventListener('load', () => {
    focusInput();
});

document.body.addEventListener('click', () => {
    focusInput();
});

addKeyDownListener('Enter', viewRefs.input, () => {
    const command = getInput().trim();
    ws.send(command);
    viewRefs.output.append(createOutputDiv('header-output', command));
    clearInput();
    setReady(false);
    scrollToPageEnd();
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
        if (lastChild == null || lastChild.className != 'text-output') {
            viewRefs.output.append(createOutputDiv(
                'text-output',
                content
            ));
        } else
            lastChild.textContent += content;
    }
    scrollToPageEnd();
};

// Handle websocket connection loss
ws.onclose = () => {
    viewRefs.output.append(createOutputDiv(
        'error-output',
        'Error the conexión'
    ));
    scrollToPageEnd();
    setError(true);
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
    updateMirror();

    input.addEventListener('scroll', () => {
        mirror.scrollTop = input.scrollTop;
    });

    document.addEventListener('selectionchange', handleSelectionChange);
    handleSelectionChange();
});

document.addEventListener('DOMContentLoaded', () => {
    setReady(false); // initial value
});

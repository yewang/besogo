(function() {
'use strict';
var besogo = window.besogo = window.besogo || {}; // Establish our namespace
besogo.VERSION = '0.0.1-alpha';

besogo.create = function(container, options) {
    var editor, // Core editor object
        resizer, // Auto-resizing function
        boardDiv, // Board display container
        panelsDiv, // Parent container of panel divs
        makers = { // Map to panel creators
            control: besogo.makeControlPanel,
            names: besogo.makeNamesPanel,
            comment: besogo.makeCommentPanel,
            tool: besogo.makeToolPanel,
            tree: besogo.makeTreePanel,
            file: besogo.makeFilePanel
        },
        insideText = container.textContent || container.innerText || '',
        width, height, // Sizing parameters
        i, panelName; // Scratch iteration variables

    container.className += ' besogo-container'; // Marks this div as initialized

    // Process options and set defaults
    options = options || {}; // Makes option checking simpler
    options.size = besogo.parseSize(options.size || 19);
    options.coord = options.coord || 'none';
    options.tool = options.tool || 'auto';
    if (options.panels === '') {
        options.panels = [];
    }
    options.panels = options.panels || 'control+names+comment+tool+tree+file';
    if (typeof options.panels === 'string') {
        options.panels = options.panels.split('+');
    }
    options.path = options.path || '';
    if (options.shadows === undefined) {
        options.shadows = 'auto';
    } else if (options.shadows === 'off') {
        options.shadows = false;
    }

    // Make the core editor object
    editor = besogo.makeEditor(options.size.x, options.size.y);
    editor.setTool(options.tool);
    editor.setCoordStyle(options.coord);
    if (options.realstones) { // Using realistic stones
        editor.REAL_STONES = true;
        editor.SHADOWS = options.shadows;
    } else { // SVG stones
        editor.SHADOWS = (options.shadows && options.shadows !== 'auto');
    }

    if (!options.nokeys) { // Add keypress handler unless nokeys option is truthy
        addKeypressHandler(container, editor);
    }

    if (options.sgf) { // Load SGF file from URL
        try {
            fetchParseLoad(options.sgf, editor, options.path);
        } catch(e) {
            // Silently fail on network error
        }
    } else if (insideText.match(/\s*\(\s*;/)) { // Text content looks like an SGF file
        parseAndLoad(insideText, editor);
        navigatePath(editor, options.path); // Navigate editor along path
    }

    if (typeof options.variants === 'number' || typeof options.variants === 'string') {
        editor.setVariantStyle(+options.variants); // Converts to number
    }

    while (container.firstChild) { // Remove all children of container
        container.removeChild(container.firstChild);
    }

    boardDiv = makeDiv('besogo-board'); // Create div for board display
    besogo.makeBoardDisplay(boardDiv, editor); // Create board display

    if (options.panels.length > 0) { // Only create if there are panels to add
        panelsDiv = makeDiv('besogo-panels');
        for (i = 0; i < options.panels.length; i++) {
            panelName = options.panels[i];
            if (makers[panelName]) { // Only add if creator function exists
                makers[panelName](makeDiv('besogo-' + panelName, panelsDiv), editor);
            }
        }
    }

    options.resize = options.resize || 'auto';
    if(options.resize === 'auto') { // Add auto-resizing unless resize option is truthy
        resizer = function() {
            var parentWidth = container.parentElement.clientWidth,
                windowHeight = window.innerHeight,
                portraitRatio = +(options.vertratio || 200) / 100,
                maxWidth = +(options.maxwidth || -1),
                minPanelHeight = +(options.minpanelheight || 400),
                minLandscapeWidth = +(options.minlandwidth || 600),
                orientation = options.orient || 'auto';

                height = windowHeight,
                width = (maxWidth > 0 && maxWidth < parentWidth) ? maxWidth : parentWidth;

            if (orientation === 'vert' || width < 600 || width < height) { // Portrait mode
                container.style['flex-direction'] = 'column';

                boardDiv.style.height = width + 'px';
                boardDiv.style.width = width + 'px';

                if (panelsDiv) {
                    // panelsDiv.style.height = ( (height > 400) ? height : 400 ) + 'px';
                    panelsDiv.style.width = width + 'px';
                }
            } else { // Landscape mode
                container.style['flex-direction'] = 'row';

                if (panelsDiv) {
                    // Reduce height if needed to ensure panels are at least 400px wide
                    height = (width - 400 < height) ? (width - 400) : height;

                    panelsDiv.style.height = height + 'px';
                    panelsDiv.style.width = (width - height) + 'px';
                }
                boardDiv.style.height = height + 'px';
                boardDiv.style.width = height + 'px';
            }
            container.style.width = width + 'px';
        };
        window.addEventListener("resize", resizer);
        resizer(); // Initialize div sizing
    }

    if (options.resize === 'fixed') {
        width = container.clientWidth;
        height = container.clientHeight;

        if (width < height) { // Portrait mode
            container.style['flex-direction'] = 'column';
            boardDiv.style.height = width + 'px';
            boardDiv.style.width = width + 'px';
            if (panelsDiv) {
                panelsDiv.style.height = (height - width) + 'px';
                panelsDiv.style.width = width + 'px';
            }
        } else { // Landscape mode
            container.style['flex-direction'] = 'row';
            boardDiv.style.height = height + 'px';
            boardDiv.style.width = height + 'px';
            if (panelsDiv) {
                panelsDiv.style.height = height + 'px';
                panelsDiv.style.width = (width - height) + 'px';
            }
        }
    }

    // Creates and adds divs to specified parent or container
    function makeDiv(className, parent) {
        var div = document.createElement("div");
        if (className) {
            div.className = className;
        }
        parent = parent || container;
        parent.appendChild(div);
        return div;
    }
}; // END function besogo.create

// Parses size parameter from SGF format
besogo.parseSize = function(input) {
    var matches,
        sizeX,
        sizeY;

    input = (input + '').replace(/\s/g, ''); // Convert to string and remove whitespace

    matches = input.match(/^(\d+):(\d+)$/); // Check for #:# pattern
    if (matches) { // Composed value pattern found
        sizeX = +matches[1]; // Convert to numbers
        sizeY = +matches[2];
    } else if (input.match(/^\d+$/)) { // Check for # pattern
        sizeX = +input; // Convert to numbers
        sizeY = +input; // Implied square
    } else { // Invalid input format
        sizeX = sizeY = 19; // Default size value
    }
    if (sizeX > 52 || sizeX < 1 || sizeY > 52 || sizeY < 1) {
        sizeX = sizeY = 19; // Out of range, set to default
    }

    return { x: sizeX, y: sizeY };
};

// Automatically converts document elements into besogo instances
besogo.autoInit = function() {
    var allDivs = document.getElementsByTagName('div'), // Live collection of divs
        targetDivs = [], // List of divs to auto-initialize
        options, // Structure to hold options
        i, j, attrs; // Scratch iteration variables

    for (i = 0; i < allDivs.length; i++) { // Iterate over all divs
        if ( (hasClass(allDivs[i], 'besogo-editor') || // Has an auto-init class
              hasClass(allDivs[i], 'besogo-viewer') ||
              hasClass(allDivs[i], 'besogo-diagram')) &&
             !hasClass(allDivs[i], 'besogo-container') ) { // Not already initialized
                targetDivs.push(allDivs[i]);
        }
    }

    for (i = 0; i < targetDivs.length; i++) { // Iterate over target divs
        options = {}; // Clear the options struct
        if (hasClass(targetDivs[i], 'besogo-editor')) {
            options.panels = ['control', 'names', 'comment', 'tool', 'tree', 'file'];
            options.tool = 'auto';
        } else if (hasClass(targetDivs[i], 'besogo-viewer')) {
            options.panels = ['control', 'names', 'comment'];
            options.tool = 'navOnly';
        } else if (hasClass(targetDivs[i], 'besogo-diagram')) {
            options.panels = [];
            options.tool = 'navOnly';
        }

        attrs = targetDivs[i].attributes;
        for (j = 0; j < attrs.length; j++) { // Load attributes as options
            options[attrs[j].name] = attrs[j].value;
        }
        besogo.create(targetDivs[i], options);
    }

    function hasClass(element, str) {
        return (element.className.split(' ').indexOf(str) !== -1);
    }
};

// Sets up keypress handling
function addKeypressHandler(container, editor) {
    if (!container.getAttribute('tabindex')) {
        container.setAttribute('tabindex', '0'); // Set tabindex to allow div focusing
    }

    container.addEventListener('keydown', function(evt) {
        evt = evt || window.event;
        switch (evt.keyCode) {
            case 33: // page up
                editor.prevNode(10);
                break;
            case 34: // page down
                editor.nextNode(10);
                break;
            case 35: // end
                editor.nextNode(-1);
                break;
            case 36: // home
                editor.prevNode(-1);
                break;
            case 37: // left
                editor.prevNode(1);
                break;
            case 38: // up
                editor.nextSibling(-1);
                break;
            case 39: // right
                editor.nextNode(1);
                break;
            case 40: // down
                editor.nextSibling(1);
                break;
            case 46: // delete
                editor.cutCurrent();
                break;
        } // END switch (evt.keyCode)
        if (evt.keyCode >= 33 && evt.keyCode <= 40) {
            evt.preventDefault(); // Suppress page nav controls
        }
    }); // END func() and addEventListener
} // END function addKeypressHandler

// Parses SGF string and loads into editor
function parseAndLoad(text, editor) {
    var sgf;
    try {
        sgf = besogo.parseSgf(text);
    } catch (error) {
        return; // Silently fail on parse error
    }
    besogo.loadSgf(sgf, editor);
}

// Fetches text file at url from same domain
function fetchParseLoad(url, editor, path) {
    var http = new XMLHttpRequest();

    http.onreadystatechange = function() {
        if (http.readyState === 4 && http.status === 200) { // Successful fetch
            parseAndLoad(http.responseText, editor);
            navigatePath(editor, path)
        }
    };
    http.overrideMimeType('text/plain'); // Prevents XML parsing and warnings
    http.open("GET", url, true); // Asynchronous load
    http.send();
}

function navigatePath(editor, path) {
    var subPaths,
        i, j; // Scratch iteration variables

    path = path.split(/[Nn]+/); // Split into parts that start in next mode
    for (i = 0; i < path.length; i++) {
        subPaths = path[i].split(/[Bb]+/); // Split on switches into branch mode
        executeMoves(subPaths[0], false); // Next mode moves
        for (j = 1; j < subPaths.length; j++) { // Intentionally starting at 1
            executeMoves(subPaths[j], true); // Branch mode moves
        }
    }

    function executeMoves(part, branch) {
        var i;
        part = part.split(/\D+/); // Split on non-digits
        for (i = 0; i < part.length; i++) {
            if (part[i]) { // Skip empty strings
                if (branch) { // Branch mode
                    if (editor.getCurrent().children.length) {
                        editor.nextNode(1);
                        editor.nextSibling(part[i] - 1);
                    }
                } else { // Next mode
                    editor.nextNode(+part[i]); // Converts to number
                }
            }
        }
    }
}

})(); // END closure

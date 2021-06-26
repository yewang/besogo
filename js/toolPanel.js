besogo.makeToolPanel = function(container, editor) {
    'use strict';
    var element, // Scratch for building SVG images
        svg, // Scratch for building SVG images
        labelText, // Text area for next label input
        selectors = {}; // Holds selection rects

    svg = makeButtonSVG('auto', 'Auto-play/navigate\n' +
        'crtl+click to force ko, suicide, overwrite\n' +
        'shift+click to jump to move'); // Auto-play/nav tool button
    svg.appendChild(makeYinYang(0, 0));

    // svg = makeButtonSVG('playB', 'Play black'); // Play black button
    // svg.appendChild(besogo.svgStone(0, 0, -1));

    // svg = makeButtonSVG('playW', 'Play white'); // Play white button
    // svg.appendChild(besogo.svgStone(0, 0, 1));

    svg = makeButtonSVG('addB', 'Set black\nctrl+click to play'); // Add black button
    element = besogo.svgEl('g');
    element.appendChild(besogo.svgStone(0, 0, -1)); // Black stone
    // element.appendChild(besogo.svgPlus(0, 0, besogo.RED)); // Red plus
    svg.appendChild(element);

    svg = makeButtonSVG('addW', 'Set white\nctrl+click to play'); // Add white button
    element = besogo.svgEl('g');
    element.appendChild(besogo.svgStone(0, 0, 1)); // White stone
    // element.appendChild(besogo.svgPlus(0, 0, besogo.RED)); // Red plus
    svg.appendChild(element);

    svg = makeButtonSVG('addE', 'Set empty point'); // Add empty button
    element = besogo.svgEl('g');
    element.appendChild(besogo.svgStone(0, 0)); // Grey stone
    element.appendChild(besogo.svgCross(0, 0, besogo.RED)); // Red cross
    svg.appendChild(element);

    svg = makeButtonSVG('circle', 'Circle'); // Circle markup button
    svg.appendChild(besogo.svgCircle(0, 0, 'black'));

    svg = makeButtonSVG('square', 'Square'); // Square markup button
    svg.appendChild(besogo.svgSquare(0, 0, 'black'));

    svg = makeButtonSVG('triangle', 'Triangle'); // Triangle markup button
    svg.appendChild(besogo.svgTriangle(0, 0, 'black'));

    svg = makeButtonSVG('cross', 'Cross'); // Cross markup button
    svg.appendChild(besogo.svgCross(0, 0, 'black'));

    svg = makeButtonSVG('block', 'Block'); // Block markup button
    svg.appendChild(besogo.svgBlock(0, 0, 'black'));

    svg = makeButtonSVG('clrMark', 'Clear mark'); // Clear markup button
    element = besogo.svgEl('g');
    element.appendChild(besogo.svgTriangle(0, 0, besogo.GREY));
    element.appendChild(besogo.svgCross(0, 0, besogo.RED));
    svg.appendChild(element);

    svg = makeButtonSVG('label', 'Label'); // Label markup button
    svg.appendChild(besogo.svgLabel(0, 0, 'black', 'A1'));

    labelText = document.createElement("input"); // Label entry text field
    labelText.type = "text";
    labelText.title = 'Next label';
    labelText.onblur = function() {
        editor.setLabel(labelText.value);
    };
    labelText.addEventListener('keydown', function(evt) {
        evt = evt || window.event;
        evt.stopPropagation(); // Stop keydown propagation when in focus
    });
    container.appendChild(labelText);

    makeButtonText('Pass', 'Pass move', function(){
        var tool = editor.getTool();
        if (tool !== 'navOnly' && tool !== 'auto' && tool !== 'playB' && tool !== 'playW') {
            editor.setTool('auto'); // Ensures that a move tool is selected
        }
        editor.click(0, 0, false); // Clicking off the board signals a pass
    });

    makeButtonText('Raise', 'Raise variation', function(){
        editor.promote();
    });

    makeButtonText('Lower', 'Lower variation', function(){
        editor.demote();
    });

    makeButtonText('Cut', 'Remove branch', function(){
        editor.cutCurrent();
    });

    editor.addListener(toolStateUpdate); // Set up listener for tool state updates
    toolStateUpdate({ label: editor.getLabel(), tool: editor.getTool() }); // Initialize


    // Creates a button holding an SVG image
    function makeButtonSVG(tool, tooltip) {
        var button = document.createElement('button'),
            svg = besogo.svgEl('svg', { // Icon container
                width: '100%',
                height: '100%',
                viewBox: '-55 -55 110 110' }), // Centered on (0, 0)
            selected = besogo.svgEl("rect", { // Selection rectangle
                x: -50, // Center on (0, 0)
                y: -50,
                width: 100,
                height: 100,
                fill: 'none',
                'stroke-width': 8,
                stroke: besogo.GOLD,
                rx: 20, // Rounded rectangle
                ry: 20, // Thanks, Steve
                visibility: 'hidden'
            });

        container.appendChild(button);
        button.appendChild(svg);
        button.onclick = function() {
            if (tool === 'auto' && editor.getTool() === 'auto') {
                editor.setTool('navOnly');
            } else {
                editor.setTool(tool);
            }
        };
        button.title = tooltip;
        selectors[tool] = selected;
        svg.appendChild(selected);
        return svg; // Returns reference to the icon container
    }

    // Creates text button
    function makeButtonText(text, tip, callback) {
        var button = document.createElement('input');
        button.type = 'button';
        button.value = text;
        button.title = tip;
        button.onclick = callback;
        container.appendChild(button);
    }

    // Callback for updating tool state and label
    function toolStateUpdate(msg) {
        var tool;
        if (msg.label) {
            labelText.value = msg.label;
        }
        if (msg.tool) {
            for (tool in selectors) { // Update which tool is selected
                if (selectors.hasOwnProperty(tool)) {
                    if (msg.tool === tool) {
                        selectors[tool].setAttribute('visibility', 'visible');
                    } else {
                        selectors[tool].setAttribute('visibility', 'hidden');
                    }
                }
            }
        }
    }

    // Draws a yin yang
    function makeYinYang(x, y) {
        var element = besogo.svgEl('g');

        // Draw black half circle on right side
        element.appendChild( besogo.svgEl("path", {
            d: "m" + x + "," + (y - 44) + " a44 44 0 0 1 0,88z",
            stroke: "none",
            fill: "black"
        }));

        // Draw white part of ying yang on left side
        element.appendChild( besogo.svgEl("path", {
            d: "m" + x + "," + (y + 44) + "a44 44 0 0 1 0,-88a22 22 0 0 1 0,44z",
            stroke: "none",
            fill: "white"
        }));

        // Draw round part of black half of ying yang
        element.appendChild( besogo.svgEl("circle", {
            cx: x,
            cy: y + 22,
            r: 22,
            stroke: "none",
            fill: "black"
        }));

        return element;
    }
};

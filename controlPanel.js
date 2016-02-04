besogo.makeControlPanel = function(container, editor) {
    'use strict';
    var leftElements = [], // SVG elements for previous node buttons
        rightElements = [], // SVG elements for next node buttons
        siblingElements = [], // SVG elements for sibling buttons
        variantStyleButton, // Button for changing variant style
        hideVariantButton, // Button for toggling show/hide variants
        childVariantElement, // SVG element for child style variants
        siblingVariantElement, // SVG element for sibling style variants
        hideVariantElement; // SVG element for hiding variants

    drawNavButtons();
    drawStyleButtons();

    editor.addListener(update);
    update({ navChange: true, variantStyle: editor.getVariantStyle() }); // Initialize

    // Callback for variant style and nav state changes
    function update(msg) {
        var current;

        if (msg.variantStyle !== undefined) {
            updateStyleButtons(msg.variantStyle);
        }

        if (msg.navChange || msg.treeChange) { // Update the navigation buttons
            current = editor.getCurrent();
            if (current.parent) { // Has parent
                arraySetColor(leftElements, 'black');
                if (current.parent.children.length > 1) { // Has siblings
                    arraySetColor(siblingElements, 'black');
                } else { // No siblings
                    arraySetColor(siblingElements, besogo.GREY);
                }
            } else { // No parent
                arraySetColor(leftElements, besogo.GREY);
                arraySetColor(siblingElements, besogo.GREY);
            }
            if (current.children.length) { // Has children
                arraySetColor(rightElements, 'black');
            } else { // No children
                arraySetColor(rightElements, besogo.GREY);
            }
        }

        function updateStyleButtons(style) { // Updates the variant style buttons
            if (style % 2) { // Sibling style variants
                childVariantElement.setAttribute('fill', 'black');
                siblingVariantElement.setAttribute('fill', besogo.BLUE);
                variantStyleButton.title = 'Variants: child/[sibling]';
            } else { // Child style variants
                childVariantElement.setAttribute('fill', besogo.BLUE);
                siblingVariantElement.setAttribute('fill', besogo.RED);
                variantStyleButton.title = 'Variants: [child]/sibling';
            }
            if (style >= 2) { // Hide auto-markup for variants
                hideVariantElement.setAttribute('visibility', 'visible');
                hideVariantButton.title = 'Variants: show/[hide]';
            } else { // Show auto-markup for variants
                hideVariantElement.setAttribute('visibility', 'hidden');
                hideVariantButton.title = 'Variants: [show]/hide';
            }
        }

        function arraySetColor(list, color) { // Changes fill color of list of svg elements
            var i;
            for (i = 0; i < list.length; i++) {
                list[i].setAttribute('fill', color);
            }
        }
    } // END function update

    // Draws the navigation buttons
    function drawNavButtons() {
        leftElements.push(makeNavButton('First node',
            '5,10 5,90 25,90 25,50 95,90 95,10 25,50 25,10',
            function() {
                editor.prevNode(-1);
            })
        );
        leftElements.push(makeNavButton('Jump back',
            '95,10 50,50 50,10 5,50 50,90 50,50 95,90',
            function() {
                editor.prevNode(10);
            })
        );
        leftElements.push(makeNavButton('Previous node', '85,10 85,90 15,50', function() {
            editor.prevNode(1);
        }));

        rightElements.push(makeNavButton('Next node', '15,10 15,90 85,50', function() {
            editor.nextNode(1);
        }));
        rightElements.push(makeNavButton('Jump forward',
            '5,10 50,50 50,10 95,50 50,90 50,50 5,90',
            function() {
                editor.nextNode(10);
            })
        );
        rightElements.push(makeNavButton('Last node',
            '95,10 95,90 75,90 75,50 5,90 5,10 75,50 75,10',
            function() {
                editor.nextNode(-1);
            })
        );

        siblingElements.push(makeNavButton('Previous sibling', '10,85 90,85 50,15', function() {
            editor.nextSibling(-1);
        }));
        siblingElements.push(makeNavButton('Next sibling', '10,15 90,15 50,85', function() {
            editor.nextSibling(1);
        }));

        function makeNavButton(tooltip, pointString, action) { // Creates a navigation button
            var button = document.createElement('button'),
                svg = makeButtonContainer(),
                element = besogo.svgEl("polygon", {
                    points: pointString,
                    stroke: 'none',
                    fill: 'black'
                });

            button.title = tooltip;
            button.onclick = action;
            button.appendChild(svg);
            svg.appendChild(element);
            container.appendChild(button);

            return element;
        } // END function makeNavButton
    } // END function drawNavButtons

    // Draws the variant style buttons
    function drawStyleButtons() {
        var svg, element, coordStyleButton;

        variantStyleButton = document.createElement('button');
        variantStyleButton.onclick = function() {
            editor.toggleVariantStyle(false); // Toggles child/sibling variants
        };
        container.appendChild(variantStyleButton);
        svg = makeButtonContainer();
        variantStyleButton.appendChild(svg);
        element = besogo.svgEl("path", {
            d: 'm75,25h-50l50,50',
            stroke: 'black',
            "stroke-width": 5,
            fill: 'none'
        });
        svg.appendChild(element);
        childVariantElement = besogo.svgEl('circle', {
            cx: 25,
            cy: 25,
            r: 20,
            stroke: 'none'
        });
        svg.appendChild(childVariantElement);
        siblingVariantElement = besogo.svgEl('circle', {
            cx: 75,
            cy: 25,
            r: 20,
            stroke: 'none'});
        svg.appendChild(siblingVariantElement);
        element = besogo.svgEl('circle', {
            cx: 75,
            cy: 75,
            r: 20,
            fill: besogo.RED,
            stroke: 'none'
        });
        svg.appendChild(element);

        hideVariantButton = document.createElement('button');
        hideVariantButton.onclick = function() {
            editor.toggleVariantStyle(true); // Toggles show/hide variants
        };
        container.appendChild(hideVariantButton);
        svg = makeButtonContainer();
        hideVariantButton.appendChild(svg);
        svg.appendChild(besogo.svgLabel(50, 50, besogo.RED, 'A'));
        hideVariantElement = besogo.svgCross(50, 50, 'black');
        svg.appendChild(hideVariantElement);

        coordStyleButton = document.createElement('button');
        coordStyleButton.onclick = function() {
            editor.toggleCoordStyle(); // Toggles coordinate style
        };
        coordStyleButton.title = 'Toggle coordinates';
        container.appendChild(coordStyleButton);
        svg = makeButtonContainer();
        coordStyleButton.appendChild(svg);
        svg.appendChild(besogo.svgLabel(50, 50, 'black', '四4'));
    } // END function drawStyleButtons

    // Makes an SVG container for the button graphics
    function makeButtonContainer() {
        return besogo.svgEl('svg', {
            width: '100%',
            height: '100%',
            viewBox: "0 0 100 100"
        });
    }
};

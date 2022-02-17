besogo.makeEditor = function(sizeX, sizeY) {
    'use strict';
    // Creates an associated game state tree
    var root = besogo.makeGameRoot(sizeX, sizeY),
        current = root, // Navigation cursor

        listeners = [], // Listeners of general game/editor state changes

        // Enumeration of editor tools/modes
        TOOLS = ['navOnly', // read-only navigate mode
            'auto', // auto-mode: navigate or auto-play color
            'playB', // play black stone
            'playW', // play white stone
            'addB', // setup black stone
            'addW', // setup white stone
            'addE', // setup empty stone
            'clrMark', // remove markup
            'circle', // circle markup
            'square', // square markup
            'triangle', // triangle markup
            'cross', // "X" cross markup
            'block', // filled square markup
            'label'], // label markup
        tool = 'auto', // Currently active tool (default: auto-mode)
        label = "1", // Next label that will be applied

        navHistory = [], // Navigation history

        gameInfo = {}, // Game info properties

        // Order of coordinate systems
        COORDS = 'none numeric western eastern pierre corner eastcor'.split(' '),
        coord = 'none', // Selected coordinate system

        // Variant style: even/odd - children/siblings, <2 - show auto markup for variants
        variantStyle = 0; // 0-3, 0 is default

    return {
        addListener: addListener,
        click: click,
        nextNode: nextNode,
        prevNode: prevNode,
        nextSibling: nextSibling,
        prevBranchPoint: prevBranchPoint,
        toggleCoordStyle: toggleCoordStyle,
        getCoordStyle: getCoordStyle,
        setCoordStyle: setCoordStyle,
        toggleVariantStyle: toggleVariantStyle,
        getVariantStyle: getVariantStyle,
        setVariantStyle: setVariantStyle,
        getGameInfo: getGameInfo,
        setGameInfo: setGameInfo,
        setComment: setComment,
        getTool: getTool,
        setTool: setTool,
        getLabel: getLabel,
        setLabel: setLabel,
        getVariants: getVariants, // Returns variants of current node
        getCurrent: getCurrent,
        setCurrent: setCurrent,
        cutCurrent: cutCurrent,
        promote: promote,
        demote: demote,
        getRoot: getRoot,
        loadRoot: loadRoot // Loads new game state
    };

    // Returns the active tool
    function getTool() {
        return tool;
    }

    // Sets the active tool, returns false if failed
    function setTool(set) {
        // Toggle label mode if already label tool already selected
        if (set === 'label' && set === tool) {
            if ( /^-?\d+$/.test(label) ) { // If current label is integer
                setLabel('A'); // Toggle to characters
            } else {
                setLabel('1'); // Toggle back to numbers
            }
            return true; // Notification already handled by setLabel
        }
        // Set the tool only if in list and actually changed
        if (TOOLS.indexOf(set) !== -1 && tool !== set) {
            tool = set;
            notifyListeners({ tool: tool, label: label }); // Notify tool change
            return true;
        }
        return false;
    }

    // Gets the next label to apply
    function getLabel() {
        return label;
    }

    // Sets the next label to apply and sets active tool to label
    function setLabel(set) {
        if (typeof set === 'string') {
            set = set.replace(/\s/g, ' ').trim(); // Convert all whitespace to space and trim
            label = set || "1"; // Default to "1" if empty string
            tool = 'label'; // Also change current tool to label
            notifyListeners({ tool: tool, label: label }); // Notify tool/label change
        }
    }

    // Toggle the coordinate style
    function toggleCoordStyle() {
        coord = COORDS[(COORDS.indexOf(coord) + 1) % COORDS.length];
        notifyListeners({ coord: coord });
    }

    // Gets the current coordinate style
    function getCoordStyle() {
        return coord;
    }

    // Sets the coordinate system style
    function setCoordStyle(setCoord) {
        if (besogo.coord[setCoord]) {
            coord = setCoord;
            notifyListeners({ coord: setCoord });
        }
    }

    // Toggles the style for showing variants
    function toggleVariantStyle(toggleShow) {
        var childStyle = variantStyle % 2, // 0: children, 1: siblings
            showStyle = variantStyle - childStyle; // 0: show auto-markup, 2: hide
        if (toggleShow) { // Truthy input toggles showing of auto-markup
            showStyle = (showStyle + 2) % 4; // 0 => 2 or 2 => 0
        } else { // Falsy input toggles child vs sibling style
            childStyle = (childStyle + 1) % 2; // 0 => 1 or 1 => 0
        }
        variantStyle = childStyle + showStyle;
        notifyListeners({ variantStyle: variantStyle, markupChange: true });
    }

    // Returns the variant style
    function getVariantStyle() {
        return variantStyle;
    }

    // Directly sets the variant style
    function setVariantStyle(style) {
        if (style === 0 || style === 1 || style === 2 || style === 3) {
            variantStyle = style;
            notifyListeners({ variantStyle: variantStyle, markupChange: true });
        }
    }

    function getGameInfo() {
        return gameInfo;
    }

    function setGameInfo(info, id) {
        if (id) {
            gameInfo[id] = info;
        } else {
            gameInfo = info;
        }
        notifyListeners({ gameInfo: gameInfo });
    }

    function setComment(text) {
        text = text.trim(); // Trim whitespace and standardize line breaks
        text = text.replace(/\r\n/g,'\n').replace(/\n\r/g,'\n').replace(/\r/g,'\n');
        text.replace(/\f\t\v\u0085\u00a0/g,' '); // Convert other whitespace to space
        current.comment = text;
        notifyListeners({ comment: text });
    }

    // Returns variants of the current node according to the set style
    function getVariants() {
        if (variantStyle >= 2) { // Do not show variants if style >= 2
            return [];
        }
        if (variantStyle === 1) { // Display sibling variants
            // Root node does not have parent nor siblings
            return current.parent ? current.parent.children : [];
        }
        return current.children; // Otherwise, style must be 0, display child variants
    }

    // Returns the currently active node in the game state tree
    function getCurrent() {
        return current;
    }

    // Returns the root of the game state tree
    function getRoot() {
        return root;
    }

    function loadRoot(load) {
        root = load;
        current = load;
        notifyListeners({ treeChange: true, navChange: true, stoneChange: true });
    }

    // Navigates forward num nodes (to the end if num === -1)
    function nextNode(num) {
        if (current.children.length === 0) { // Check if no children
            return false; // Do nothing if no children (avoid notification)
        }
        while (current.children.length > 0 && num !== 0) {
            if (navHistory.length) { // Non-empty navigation history
                current = navHistory.pop();
            } else { // Empty navigation history
                current = current.children[0]; // Go to first child
            }
            num--;
        }
        // Notify listeners of navigation (with no tree edits)
        notifyListeners({ navChange: true }, true); // Preserve history
    }

    // Navigates backward num nodes (to the root if num === -1)
    function prevNode(num) {
        if (current.parent === null) { // Check if root
            return false; // Do nothing if already at root (avoid notification)
        }
        while (current.parent && num !== 0) {
            navHistory.push(current); // Save current into navigation history
            current = current.parent;
            num--;
        }
        // Notify listeners of navigation (with no tree edits)
        notifyListeners({ navChange: true }, true); // Preserve history
    }

    // Cyclically switches through siblings
    function nextSibling(change) {
        var siblings,
            i = 0;

        if (current.parent) {
            siblings = current.parent.children;

            // Exit early if only child
            if (siblings.length === 1) {
                return;
            }

            // Find index of current amongst siblings
            i = siblings.indexOf(current);

            // Apply change cyclically
            i = (i + change) % siblings.length;
            if (i < 0) {
                i += siblings.length;
            }

            current = siblings[i];
            // Notify listeners of navigation (with no tree edits)
            notifyListeners({ navChange: true });
        }
    }

    // Return to the previous branch point
    function prevBranchPoint(change) {
        if ( current.parent === null ) { // Check if root
          return false; // Do nothing if already at root
        }

        navHistory.push(current); // Save starting position in case we do not find a branch point

        while ( current.parent && current.parent.children.length === 1 ) { // Traverse backwards until we find a sibling
            current = current.parent;
        }

        if ( current.parent ) {
            current = current.parent;
            notifyListeners({ navChange: true });
        } else {
            current = navHistory.pop(current);
            return false;
        }

    }

    // Sets the current node
    function setCurrent(node) {
        if (current !== node) {
            current = node;
            // Notify listeners of navigation (with no tree edits)
            notifyListeners({ navChange: true });
        }
    }

    // Removes current branch from the tree
    function cutCurrent() {
        var parent = current.parent;
        if (tool === 'navOnly') {
            return; // Tree editing disabled in navOnly mode
        }
        if (parent) {
            if (confirm("Delete this branch?") === true) {
                parent.removeChild(current);
                current = parent;
                // Notify navigation and tree edited
                notifyListeners({ treeChange: true, navChange: true });
            }
        }
    }

    // Raises current variation to a higher precedence
    function promote() {
        if (tool === 'navOnly') {
            return; // Tree editing disabled in navOnly mode
        }
        if (current.parent && current.parent.promote(current)) {
            notifyListeners({ treeChange: true }); // Notify tree edited
        }
    }

    // Drops current variation to a lower precedence
    function demote() {
        if (tool === 'navOnly') {
            return; // Tree editing disabled in navOnly mode
        }
        if (current.parent && current.parent.demote(current)) {
            notifyListeners({ treeChange: true }); // Notify tree edited
        }
    }

    // Handle click with application of selected tool
    function click(i, j, ctrlKey, shiftKey) {
        switch(tool) {
            case 'navOnly':
                navigate(i, j, shiftKey);
                break;
            case 'auto':
                if (!navigate(i, j, shiftKey) && !shiftKey) { // Try to navigate to (i, j)
                    playMove(i, j, 0, ctrlKey); // Play auto-color move if navigate fails
                }
                break;
            case 'playB':
                playMove(i, j, -1, ctrlKey); // Black move
                break;
            case 'playW':
                playMove(i, j, 1, ctrlKey); // White move
                break;
            case 'addB':
                if (ctrlKey) {
                    playMove(i, j, -1, true); // Play black
                } else {
                    placeSetup(i, j, -1); // Set black
                }
                break;
            case 'addW':
                if (ctrlKey) {
                    playMove(i, j, 1, true); // Play white
                } else {
                    placeSetup(i, j, 1); // Set white
                }
                break;
            case 'addE':
                placeSetup(i, j, 0);
                break;
            case 'clrMark':
                setMarkup(i, j, 0);
                break;
            case 'circle':
                setMarkup(i, j, 1);
                break;
            case 'square':
                setMarkup(i, j, 2);
                break;
            case 'triangle':
                setMarkup(i, j, 3);
                break;
            case 'cross':
                setMarkup(i, j, 4);
                break;
            case 'block':
                setMarkup(i, j, 5);
                break;
            case 'label':
                setMarkup(i, j, label);
                break;
        }
    }

    // Navigates to child with move at (x, y), searching tree if shift key pressed
    // Returns true is successful, false if not
    function navigate(x, y, shiftKey) {
        var i, move,
            children = current.children;

        // Look for move across children
        for (i = 0; i < children.length; i++) {
            move = children[i].move;
            if (shiftKey) { // Search for move in branch
                if (jumpToMove(x, y, children[i])) {
                    return true;
                }
            } else if (move && move.x === x && move.y === y) {
                current = children[i]; // Navigate to child if found
                notifyListeners({ navChange: true }); // Notify navigation (with no tree edits)
                return true;
            }
        }

        if (shiftKey && jumpToMove(x, y, root, current)) {
            return true;
        }
        return false;
    }

    // Recursive function for jumping to move with depth-first search
    function jumpToMove(x, y, start, end) {
        var i, move,
            children = start.children;

        if (end && end === start) {
            return false;
        }

        move = start.move;
        if (move && move.x === x && move.y === y) {
            current = start;
            notifyListeners({ navChange: true }); // Notify navigation (with no tree edits)
            return true;
        }

        for (i = 0; i < children.length; i++) {
            if (jumpToMove(x, y, children[i], end)) {
                return true;
            }
        }
        return false;
    }

    // Plays a move at the given color and location
    // Set allowAll to truthy to allow illegal moves
    function playMove(i, j, color, allowAll) {
        var next;
        // Check if current node is immutable or root
        if ( !current.isMutable('move') || !current.parent ) {
            next = current.makeChild(); // Create a new child node
            if (next.playMove(i, j, color, allowAll)) { // Play in new node
                // Keep (add to game state tree) only if move succeeds
                current.addChild(next);
                current = next;
                // Notify tree change, navigation, and stone change
                notifyListeners({ treeChange: true, navChange: true, stoneChange: true });
            }
        // Current node is mutable and not root
        } else if(current.playMove(i, j, color, allowAll)) { // Play in current
            // Only need to update if move succeeds
            notifyListeners({ stoneChange: true }); // Stones changed
        }
    }

    // Places a setup stone at the given color and location
    function placeSetup(i, j, color) {
        var next;
        if (color === current.getStone(i, j)) { // Compare setup to current
            if (color !== 0) {
                color = 0; // Same as current indicates removal desired
            } else { // Color and current are both empty
                return; // No change if attempting to set empty to empty
            }
        }
        // Check if current node can accept setup stones
        if (!current.isMutable('setup')) {
            next = current.makeChild(); // Create a new child node
            if (next.placeSetup(i, j, color)) { // Place setup stone in new node
                // Keep (add to game state tree) only if change occurs
                current.addChild(next);
                current = next;
                // Notify tree change, navigation, and stone change
                notifyListeners({ treeChange: true, navChange: true, stoneChange: true });
            }
        } else if(current.placeSetup(i, j, color)) { // Try setup in current
            // Only need to update if change occurs
            notifyListeners({ stoneChange: true }); // Stones changed
        }
    }

    // Sets the markup at the given location and place
    function setMarkup(i, j, mark) {
        var temp; // For label incrementing
        if (mark === current.getMarkup(i, j)) { // Compare mark to current
            if (mark !== 0) {
                mark = 0; // Same as current indicates removal desired
            } else { // Mark and current are both empty
                return; // No change if attempting to set empty to empty
            }
        }
        if (current.addMarkup(i, j, mark)) { // Try to add the markup
            if (typeof mark === 'string') { // If markup is a label, increment the label
                if (/^-?\d+$/.test(mark)) { // Integer number label
                    temp = +mark; // Convert to number
                    // Increment and convert back to string
                    setLabel( "" + (temp + 1) );
                } else if ( /[A-Za-z]$/.test(mark) ) { // Ends with [A-Za-z]
                    // Get the last character in the label
                    temp = mark.charAt(mark.length - 1);
                    if (temp === 'z') { // Cyclical increment
                        temp = 'A'; // Move onto uppercase letters
                    } else if (temp === 'Z') {
                        temp = 'a'; // Move onto lowercase letters
                    } else {
                        temp = String.fromCharCode(temp.charCodeAt() + 1);
                    }
                    // Replace last character of label with incremented char
                    setLabel( mark.slice(0, mark.length - 1) + temp );
                }
            }
            notifyListeners({ markupChange: true }); // Notify markup change
        }
    }

    // Adds a listener (by call back func) that will be notified on game/editor state changes
    function addListener(listener) {
        listeners.push(listener);
    }

    // Notify listeners with the given message object
    //  Data sent to listeners:
    //    tool: changed tool selection
    //    label: changed next label
    //    coord: changed coordinate system
    //    variantStyle: changed variant style
    //    gameInfo: changed game info
    //    comment: changed comment in current node
    //  Flags sent to listeners:
    //    treeChange: nodes added or removed from tree
    //    navChange: current switched to different node
    //    stoneChange: stones modified in current node
    //    markupChange: markup modified in current node
    function notifyListeners(msg, keepHistory) {
        var i;
        if (!keepHistory && msg.navChange) {
            navHistory = []; // Clear navigation history
        }
        for (i = 0; i < listeners.length; i++) {
            listeners[i](msg);
        }
    }
};

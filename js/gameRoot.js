besogo.makeGameRoot = function(sizeX, sizeY) {
    'use strict';
    var BLACK = -1, // Stone state constants
        WHITE = 1, // Equal to -BLACK
        EMPTY = 0, // Any falsy (e.g., undefined) value is also empty

        root = { // Inherited attributes of root node
            blackCaps: 0,
            whiteCaps: 0,
            moveNumber: 0
        };

    // Initializes non-inherited attributes
    function initNode(node, parent) {
        node.parent = parent;
        node.children = [];

        node.move = null;
        node.setupStones = [];
        node.markup = [];
        node.comment = ''; // Comment on this node
    }
    initNode(root, null); // Initialize root node with null parent

    // Plays a move, returns true if successful
    // Set allow to truthy to allow overwrite, suicide and ko
    root.playMove = function(x, y, color, allow) {
        var captures = 0, // Number of captures made by this move
            overwrite = false, // Flags whether move overwrites a stone
            prevMove, // Previous move for ko check
            testBoard, // Copy of board state to test captures, ko, and suicide
            pending, // Pending capture locations
            i; // Scratch iteration variable

        if (!this.isMutable('move')) {
            return false; // Move fails if node is immutable
        }

        if (!color) { // Falsy color indicates auto-color
            color = this.nextMove();
        }

        if (x < 1 || y < 1 || x > sizeX || y > sizeY) {
            this.move = { // Register as pass move if out of bounds
                x: 0, y: 0, // Log pass as position (0, 0)
                color: color,
                captures: 0, // Pass never captures
                overwrite: false // Pass is never an overwrite
            };
            this.lastMove = color; // Store color of last move
            this.moveNumber++; // Increment move number
            return true; // Pass move successful
        }

        if (this.getStone(x, y)) { // Check for overwrite
            if (!allow) {
                return false; // Reject overwrite move if not allowed
            }
            overwrite = true; // Otherwise, flag overwrite and proceed
        }

        testBoard = Object.create(this); // Copy board state (no need to initialize)
        pending = []; // Initialize pending capture array

        setStone(testBoard, x, y, color); // Place the move stone

        // Check for captures of surrounding chains
        captureStones(testBoard, x - 1, y, color, pending);
        captureStones(testBoard, x + 1, y, color, pending);
        captureStones(testBoard, x, y - 1, color, pending);
        captureStones(testBoard, x, y + 1, color, pending);

        captures = pending.length; // Capture count

        prevMove = this.parent ? this.parent.move : null; // Previous move played
        if (!allow && prevMove && // If previous move exists, ...
            prevMove.color === -color && // was of the opposite color, ...
            prevMove.overwrite === false && // not an overwrite, ...
            prevMove.captures === 1 && // captured exactly one stone, and if ...
            captures === 1 && // this move captured exactly one stone at the location ...
            !testBoard.getStone(prevMove.x, prevMove.y) ) { // of the previous move
                return false; // Reject ko move if not allowed
        }

        if (captures === 0) { // Check for suicide if nothing was captured
            captureStones(testBoard, x, y, -color, pending); // Invert color for suicide check
            captures = -pending.length; // Count suicide as negative captures
            if (captures < 0 && !allow) {
                return false; // Reject suicidal move if not allowed
            }
        }

        if (color * captures < 0) { // Capture by black or suicide by white
            this.blackCaps += Math.abs(captures); // Tally captures for black
        } else { // Capture by white or suicide by black
            this.whiteCaps += Math.abs(captures); // Tally captures for white
        }

        setStone(this, x, y, color); // Place the stone
        for (i = 0; i < pending.length; i++) { // Remove the captures
            setStone(this, pending[i].x, pending[i].y, EMPTY);
        }

        this.move = { // Log the move
            x: x, y: y,
            color: color,
            captures: captures,
            overwrite: overwrite
        };
        this.lastMove = color; // Store color of last move
        this.moveNumber++; // Increment move number
        return true;
    }; // END func root.playMove

    // Check for and perform capture of opposite color chain at (x, y)
    function captureStones(board, x, y, color, captures) {
        var pending = [],
            i; // Scratch iteration variable

        if ( !recursiveCapture(board, x, y, color, pending) ) { // Captured chain found
            for (i = 0; i < pending.length; i++) { // Remove captured stones
                setStone(board, pending[i].x, pending[i].y, EMPTY);
                captures.push(pending[i]);
            }
        }
    }

    // Recursively builds a chain of pending captures starting from (x, y)
    // Stops and returns true if chain has liberties
    function recursiveCapture(board, x, y, color, pending) {
        var i; // Scratch iteration variable

        if (x < 1 || y < 1 || x > sizeX || y > sizeY) {
            return false; // Stop if out of bounds
        }
        if (board.getStone(x, y) === color) {
            return false; // Stop if other color found
        }
        if (!board.getStone(x, y)) {
            return true; // Stop and signal that liberty was found
        }
        for (i = 0; i < pending.length; i++) {
            if (pending[i].x === x && pending[i].y === y) {
                return false; // Stop if already in pending captures
            }
        }

        pending.push({ x: x, y: y }); // Add new stone into chain of pending captures

        // Recursively check for liberties and expand chain
        if (recursiveCapture(board, x - 1, y, color, pending) ||
            recursiveCapture(board, x + 1, y, color, pending) ||
            recursiveCapture(board, x, y - 1, color, pending) ||
            recursiveCapture(board, x, y + 1, color, pending)) {
                return true; // Stop and signal liberty found in subchain
        }
        return false; // Otherwise, no liberties found
    }

    // Get next to move
    root.nextMove = function() {
        var x, y, count = 0;
        if (this.lastMove) { // If a move has been played
            return -this.lastMove; // Then next is opposite of last move
        } else { // No moves have been played
            for (x = 1; x <= sizeX; x++) {
                for (y = 1; y <= sizeY; y++) {
                    // Counts up difference between black and white set stones
                    count += this.getStone(x, y);
                }
            }
            // White's turn if strictly more black stones are set
            return (count < 0) ? WHITE : BLACK;
        }
    };

    // Places a setup stone, returns true if successful
    root.placeSetup = function(x, y, color) {
        var prevColor = (this.parent && this.parent.getStone(x, y)) || EMPTY;

        if (x < 1 || y < 1 || x > sizeX || y > sizeY) {
            return false; // Do not allow out of bounds setup
        }
        if (!this.isMutable('setup') || this.getStone(x, y) === color) {
            // Prevent setup changes in immutable node or quit early if no change
            return false;
        }

        setStone(this, x, y, color); // Place the setup stone
        this.setupStones[ fromXY(x, y) ] = color - prevColor; // Record the necessary change
        return true;
    };

    // Adds markup, returns true if successful
    root.addMarkup = function(x, y, mark) {
        if (x < 1 || y < 1 || x > sizeX || y > sizeY) {
            return false; // Do not allow out of bounds markup
        }
        if (this.getMarkup(x, y) === mark) { // Quit early if no change to make
            return false;
        }
        this.markup[ fromXY(x, y) ] = mark;
        return true;
    };

    // Returns the stone status of the given position
    root.getStone = function(x, y) {
        return this['board' + x + '-' + y] || EMPTY;
    };

    // Directly sets the stone state for the given game node
    function setStone(node, x, y, color) {
        node['board' + x + '-' + y] = color;
    }

    // Gets the setup stone placed at (x, y), returns false if none
    root.getSetup = function(x, y) {
        if (!this.setupStones[ fromXY(x, y) ]) { // No setup stone placed
            return false;
        } else { // Determine net effect of setup stone
            switch(this.getStone(x, y)) {
                case EMPTY:
                    return 'AE';
                case BLACK:
                    return 'AB';
                case WHITE:
                    return 'AW';
            }
        }
    };

    // Gets the markup at (x, y)
    root.getMarkup = function(x, y) {
        return this.markup[ fromXY(x, y) ] || EMPTY;
    };

    // Determines the type of this node
    root.getType = function() {
        var i;

        if (this.move) { // Logged move implies move node
            return 'move';
        }

        for (i = 0; i < this.setupStones.length; i++) {
            if (this.setupStones[i]) { // Any setup stones implies setup node
                return 'setup';
            }
        }

        return 'empty'; // Otherwise, "empty" (neither move nor setup)
    };

    // Checks if this node can be modified by a 'type' action
    root.isMutable = function(type) {
        // Can only add a move to an empty node with no children
        if (type === 'move' && this.getType() === 'empty' && this.children.length === 0) {
            return true;
        }
        // Can only add setup stones to a non-move node with no children
        if (type === 'setup' && this.getType() !== 'move' && this.children.length === 0) {
            return true;
        }
        return false;
    };

    // Gets siblings of this node
    root.getSiblings = function() {
        return (this.parent && this.parent.children) || [];
    };

    // Makes a child node of this node, but does NOT add it to children
    root.makeChild = function() {
        var child = Object.create(this); // Child inherits properties
        initNode(child, this); // Initialize other properties

        return child;
    };

    // Adds a child to this node
    root.addChild = function(child) {
        this.children.push(child);
    };

    // Remove child node from this node, returning false if failed
    root.removeChild = function(child) {
        var i = this.children.indexOf(child);
        if (i !== -1) {
            this.children.splice(i, 1);
            return true;
        }
        return false;
    };

    // Raises child variation to a higher precedence
    root.promote = function(child) {
        var i = this.children.indexOf(child);
        if (i > 0) { // Child exists and not already first
            this.children[i] = this.children[i - 1];
            this.children[i - 1] = child;
            return true;
        }
        return false;
    };

    // Drops child variation to a lower precedence
    root.demote = function(child) {
        var i = this.children.indexOf(child);
        if (i !== -1 && i < this.children.length - 1) { // Child exists and not already last
            this.children[i] = this.children[i + 1];
            this.children[i + 1] = child;
            return true;
        }
        return false;
    };

    // Gets board size
    root.getSize = function() {
        return { x: sizeX, y: sizeY };
    };

    // Convert (x, y) coordinates to linear index
    function fromXY(x, y) {
        return (x - 1) * sizeY + (y - 1);
    }

    return root;
};

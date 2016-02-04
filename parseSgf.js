besogo.parseSgf = function(text) {
    'use strict';
    var at = 0, // Current position
        ch = text.charAt(at); // Current character at position

    findOpenParens(); // Find beginning of game tree
    return parseTree(); // Parse game tree

    // Builds and throws an error
    function error(msg) {
        throw {
            name: "Syntax Error",
            message: msg,
            at: at,
            text: text
        };
    }

    // Advances text position by one
    function next(check) {
        if (check && check !== ch) { // Verify current character if param given
            error( "Expected '" + check + "' instead of '" + ch + "'");
        }
        at++;
        ch = text.charAt(at);
        return ch;
    }

    // Skips over whitespace until non-whitespace found
    function white() {
        while (ch && ch <= ' ') {
            next();
        }
    }

    // Skips all chars until '(' or end found
    function findOpenParens() {
        while (ch && ch !== '(') {
            next();
        }
    }

    // Returns true if line break (CR, LF, CR+LF, LF+CR) found
    // Advances the cursor ONCE for double character (CR+LF, LF+CR) line breaks
    function lineBreak() {
        if (ch === '\n') { // Line Feed (LF)
            if (text.charAt(at + 1) === '\r') { // LF+CR, double character line break
                next(); // Advance cursor only once (pointing at second character)
            }
            return true;
        } else if (ch === '\r') { // Carriage Return (CR)
            if (text.charAt(at + 1) === '\n') { // CR+LF, double character line break
                next(); // Advance cursor only once (pointing at second character)
            }
            return true;
        }
        return false; // Did not find a line break or advance
    }

    // Parses a sub-tree of the game record
    function parseTree() {
        var rootNode, // Root of this sub-tree
            currentNode, // Pointer to parent of the next node
            nextNode; // Scratch for parsing the next node or sub-tree

        next('('); // Double-check opening parens at start of sub-tree
        white(); // Skip whitespace before root node

        if (ch !== ";") { // Error on sub-tree missing root node
            error("Sub-tree missing root");
        }
        rootNode = parseNode(); // Get the first node of this sub-tree
        white(); // Skip whitespace before parsing next node

        currentNode = rootNode; // Parent of the next node parsed
        while (ch === ';') { // Get sequence of nodes within this sub-tree
            nextNode = parseNode(); // Parse the next node
            // Add next node as child of current
            currentNode.children.push(nextNode);
            currentNode = nextNode; // Advance current pointer to this child
            white(); // Skip whitespace between/after sequence nodes
        }

        // Look for sub-trees of this sub-tree
        while (ch === "(") {
            nextNode = parseTree(); // Parse the next sub-tree
            // Add sub-tree as child of last sequence node
            currentNode.children.push(nextNode); // Do NOT advance current
            white(); // Skip whitespace between/after sub-trees
        }
        next(')'); // Expect closing parenthesis at end of this sub-tree

        return rootNode;
    }

    // Parses a node and its properties
    function parseNode() {
        var property, // Scratch for parsing properties
            node = { props: [], children: [] }; // Node to construct

        next(';'); // Double-check semi-colon at start of node
        white(); // Skip whitespace before properties
        // Parse properties until end of node detected
        while ( ch && ch !== ';' && ch !== '(' && ch !== ')') {
            property = parseProperty(); // Parse the property and values
            node.props.push(property); // Add property to node
            white(); // Skip whitespace between/after properties
        }

        return node;
    }

    // Parses a property and its values
    function parseProperty() {
        var property = { id: '', values: [] }; // Property to construct

        // Look for property ID within letters
        while ( ch && /[A-Za-z]/.test(ch) ) {
            if (/[A-Z]/.test(ch)) { // Ignores lower case letters
                property.id += ch; // Only adds upper case letters
            }
            next();
        }
        if (!property.id) { // Error if id empty
            error('Missing property ID');
        }

        white(); // Skip whitespace before values
        while(ch === '[') { // Look for values of this property
            property.values.push( parseValue() );
            white(); // Skip whitespace between/after values
        }
        if (property.values.length === 0) { // Error on empty list of values
            error('Missing property values');
        }

        return property;
    }

    // Parses a value
    function parseValue() {
        var value = '';
        next('['); // Double-check opening bracket at start of value

        // Read until end of value (unescaped closing bracket)
        while ( ch && ch !== ']' ) {
            if ( ch === '\\' ) { // Backslash escape handling
                next('\\');
                if (lineBreak()) { // Soft (escaped) line break
                    // Nothing, soft line breaks are removed
                } else if (ch <= ' ') { // Other whitespace
                    value += ' '; // Convert to space
                } else {
                    value += ch; // Pass other escaped characters verbatim
                }
            } else { // Non-escaped character
                if (lineBreak()) { // Hard (non-escaped) line break
                    value += '\n'; // Convert all new lines to just LF
                } else if (ch <= ' ') { // Other whitespace
                    value += ' '; // Convert to space
                } else {
                    value += ch; // Other characters
                }
            }
            next();
        }
        next(']'); // Expect closing bracket at end of value

        return value;
    }
};

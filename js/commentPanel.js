besogo.makeCommentPanel = function(container, editor) {
    'use strict';
    var infoTexts = {}, // Holds text nodes for game info properties
        gameInfoTable = document.createElement('table'),
        gameInfoEdit = document.createElement('table'),
        commentBox = document.createElement('div'),
        commentEdit = document.createElement('textarea'),
        playerInfoOrder = 'PW WR WT PB BR BT'.split(' '),
        infoOrder = 'HA KM RU TM OT GN EV PC RO DT RE ON GC AN US SO CP'.split(' '),
        infoIds = {
            PW: 'White Player',
            WR: 'White Rank',
            WT: 'White Team',
            PB: 'Black Player',
            BR: 'Black Rank',
            BT: 'Black Team',

            HA: 'Handicap',
            KM: 'Komi',
            RU: 'Rules',
            TM: 'Timing',
            OT: 'Overtime',

            GN: 'Game Name',
            EV: 'Event',
            PC: 'Place',
            RO: 'Round',
            DT: 'Date',

            RE: 'Result',
            ON: 'Opening',
            GC: 'Comments',

            AN: 'Annotator',
            US: 'Recorder',
            SO: 'Source',
            CP: 'Copyright'
        };

    container.appendChild(makeInfoButton());
    container.appendChild(makeInfoEditButton());
    container.appendChild(makeCommentButton());
    container.appendChild(gameInfoTable);
    container.appendChild(gameInfoEdit);
    infoTexts.C = document.createTextNode('');
    container.appendChild(commentBox);
    commentBox.appendChild(infoTexts.C);
    container.appendChild(commentEdit);

    commentEdit.onblur = function() {
        editor.setComment(commentEdit.value);
    };
    commentEdit.addEventListener('keydown', function(evt) {
        evt = evt || window.event;
        evt.stopPropagation(); // Stop keydown propagation when in focus
    });

    editor.addListener(update);
    update({ navChange: true, gameInfo: editor.getGameInfo() });
    gameInfoEdit.style.display = 'none'; // Hide game info editting table initially

    function update(msg) {
        var temp; // Scratch for strings

        if (msg.navChange) {
            temp = editor.getCurrent().comment || '';
            updateText(commentBox, temp, 'C');
            if (editor.getCurrent() === editor.getRoot() &&
                gameInfoTable.firstChild &&
                gameInfoEdit.style.display === 'none') {
                    gameInfoTable.style.display = 'table';
            } else {
                gameInfoTable.style.display = 'none';
            }
            commentEdit.style.display = 'none';
            commentBox.style.display = 'block';
        } else if (msg.comment !== undefined) {
            updateText(commentBox, msg.comment, 'C');
            commentEdit.value = msg.comment;
        }

        if (msg.gameInfo) { // Update game info
            updateGameInfoTable(msg.gameInfo);
            updateGameInfoEdit(msg.gameInfo);
        }
    } // END function update

    function updateGameInfoTable(gameInfo) {
        var table = document.createElement('table'),
            i, id, row, cell, text; // Scratch iteration variable

        table.className = 'besogo-gameInfo';
        for (i = 0; i < infoOrder.length ; i++) { // Iterate in specified order
            id = infoOrder[i];

            if (gameInfo[id]) { // Only add row if property exists
                row = document.createElement('tr');
                table.appendChild(row);

                cell = document.createElement('td');
                cell.appendChild(document.createTextNode(infoIds[id]));
                row.appendChild(cell);

                cell = document.createElement('td');
                text = document.createTextNode(gameInfo[id]);
                cell.appendChild(text);
                row.appendChild(cell);
            }
        }
        if (!table.firstChild || gameInfoTable.style.display === 'none') {
            table.style.display = 'none'; // Do not display empty table or if already hidden
        }
        container.replaceChild(table, gameInfoTable);
        gameInfoTable = table;
    }

    function updateGameInfoEdit(gameInfo) {
        var table = document.createElement('table'),
            infoTableOrder = playerInfoOrder.concat(infoOrder),
            i, id, row, cell, text;

        table.className = 'besogo-gameInfo';
        for (i = 0; i < infoTableOrder.length ; i++) { // Iterate in specified order
            id = infoTableOrder[i];
            row = document.createElement('tr');
            table.appendChild(row);

            cell = document.createElement('td');
            cell.appendChild(document.createTextNode(infoIds[id]));
            row.appendChild(cell);

            cell = document.createElement('td');
            text = document.createElement('input');
            if (gameInfo[id]) {
                text.value = gameInfo[id];
            }
            text.onblur = function(t, id) {
                return function() { // Commit change on blur
                    editor.setGameInfo(t.value, id);
                };
            }(text, id);
            text.addEventListener('keydown', function(evt) {
                evt = evt || window.event;
                evt.stopPropagation(); // Stop keydown propagation when in focus
            });
            cell.appendChild(text);
            row.appendChild(cell);
        }
        if (gameInfoEdit.style.display === 'none') {
            table.style.display = 'none'; // Hide if already hidden
        }
        container.replaceChild(table, gameInfoEdit);
        gameInfoEdit = table;
    }

    function updateText(parent, text, id) {
        var textNode = document.createTextNode(text);
        parent.replaceChild(textNode, infoTexts[id]);
        infoTexts[id] = textNode;
    }

    function makeInfoButton() {
        var button = document.createElement('input');
        button.type = 'button';
        button.value = 'Info';
        button.title = 'Show/hide game info';

        button.onclick = function() {
            if (gameInfoTable.style.display === 'none' && gameInfoTable.firstChild) {
                gameInfoTable.style.display = 'table';
            } else {
                gameInfoTable.style.display = 'none';
            }
            gameInfoEdit.style.display = 'none';
        };
        return button;
    }

    function makeInfoEditButton() {
        var button = document.createElement('input');
        button.type = 'button';
        button.value = 'Edit Info';
        button.title = 'Edit game info';

        button.onclick = function() {
            if (gameInfoEdit.style.display === 'none') {
                gameInfoEdit.style.display = 'table';
            } else {
                gameInfoEdit.style.display = 'none';
            }
            gameInfoTable.style.display = 'none';
        };
        return button;
    }

    function makeCommentButton() {
        var button = document.createElement('input');
        button.type = 'button';
        button.value = 'Comment';
        button.title = 'Edit comment';

        button.onclick = function() {
            if (commentEdit.style.display === 'none') { // Comment edit box hidden
                commentBox.style.display = 'none'; // Hide static comment display
                gameInfoTable.style.display = 'none'; // Hide game info table
                commentEdit.value = editor.getCurrent().comment;
                commentEdit.style.display = 'block'; // Show comment edit box
            } else { // Comment edit box open
                commentEdit.style.display = 'none'; // Hide comment edit box
                commentBox.style.display = 'block'; // Show static comment display
            }
        };
        return button;
    }

};

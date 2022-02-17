besogo.makeNamesPanel = function(container, editor) {
    'use strict';
    var playerBox = document.createElement('div'),
        whiteBox = document.createElement('div'),
        blackBox = document.createElement('div'),
        whiteInfo = document.createTextNode(''),
        blackInfo = document.createTextNode(''),
        whiteCaps = document.createElement('span'),
        blackCaps = document.createElement('span');

    playerBox.className = 'besogo-playerInfo';
    whiteBox.className = 'besogo-whiteInfo';
    blackBox.className = 'besogo-blackInfo';
    whiteCaps.className = 'besogo-whiteCaps';
    whiteCaps.title = 'White captures';
    blackCaps.className = 'besogo-blackCaps';
    blackCaps.title = 'Black captures';
    whiteBox.appendChild(whiteInfo);
    whiteBox.appendChild(whiteCaps);
    blackBox.appendChild(blackInfo);
    blackBox.appendChild(blackCaps);
    playerBox.appendChild(whiteBox);
    playerBox.appendChild(blackBox);
    container.appendChild(playerBox);

    editor.addListener(update);
    update({ navChange: true, gameInfo: editor.getGameInfo() });

    function update(msg) {
        var infoString, // Scratch string
            textNode,
            current,
            passFlag = 0;

        if (msg.gameInfo) {
            infoString = (msg.gameInfo.PW || 'White') + // White name
                ' (' + (msg.gameInfo.WR || '?') + ')' + // White rank
                (msg.gameInfo.WT ? ' ' + msg.gameInfo.WT : ''); // White team
            textNode = document.createTextNode(infoString);
            whiteBox.replaceChild(textNode, whiteInfo);
            whiteInfo = textNode;

            infoString = (msg.gameInfo.PB || 'Black') + // Black name
                ' (' + (msg.gameInfo.BR || '?') + ')' + // Black rank
                (msg.gameInfo.BT ? ' ' + msg.gameInfo.BT : ''); // Black team
            textNode = document.createTextNode(infoString);
            blackBox.replaceChild(textNode, blackInfo);
            blackInfo = textNode;
        }

        if (msg.navChange || msg.stoneChange) {
            current = editor.getCurrent();
            if (current.move && current.move.x === 0 && current.move.y === 0) {
                passFlag = current.move.color;
            }
            updateText(whiteCaps, (passFlag === 1 ? 'Passed  ' : '') + current.whiteCaps);
            updateText(blackCaps, current.blackCaps + (passFlag === -1 ? '  Passed' : ''));
        }
    }

    function updateText(parent, text) {
        var textNode = document.createTextNode(text);
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
        parent.appendChild(textNode);
    }
};

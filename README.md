BesoGo
======

Embeddable editor/viewer of SGF records for the game of Go (aka Weiqi, Baduk)

Written in JavaScript, CSS, and HTML5, with no dependencies on other libraries

Free software released under the [GNU Affero General Public License](http://www.gnu.org/licenses/agpl.html), see "Copying and License" below


User Notes
----------

BesoGo can be used as a web-based SGF editor, an embeddable SGF viewer, or a board diagram renderer

An example SGF editor (based on the latest release) can be used at <http://yewang.github.io/besogo/>

Use <http://yewang.github.io/besogo/testing.html> for an SGF editor based on the latest code snapshot, with experimental themes available at:
- <http://yewang.github.io/besogo/testing.html?theme=dark>
- <http://yewang.github.io/besogo/testing.html?theme=book>
- <http://yewang.github.io/besogo/testing.html?theme=alt>

When entering moves, overwrite, suicide, and basic ko moves are not allowed, but can be enabled by holding down `ctrl` while clicking

#### Navigation key bindings
- `left` previous node
- `right` next node
- `page up` jump back 10 nodes
- `page down` jump forward 10 nodes
- `home` jump to first node
- `end` jump to last node
- `delete` remove current branch

BesoGo supports the [SGF standard](http://www.red-bean.com/sgf/) for Go game records.
BesoGo should always output SGF files that comply with the standard (besides the exceptions listed below).
BesoGo permissively imports SGF file input, allowing many common SGF syntax errors,
while attempting to fix any issues and converting to valid SGF on output.

#### Exceptions in SGF standard support
- Some properties are unsupported and ignored:
   - Time left `OB`, `OW`, `BL`, `WL`
   - Move annotations `BM`, `DO`, `IT`, `TE`
   - Control annotations `KO`, `MN`, `PL`
   - Some general annotations `DM`, `GB`, `GW`, `HO`, `N `, `UC`, `V `
   - Some markup `AR`, `LN`, `TB`, `TW`, `DD`, `FG`, `PM`, `VW`
- No special validation is performed on game info properties:
`PB`, `BR`, `BT`, `PW`, `WR`, `WT`,
`HA`, `KM`, `RU`, `TM`, `OT`,
`DT`, `EV`, `GN`, `PC`, `RO`,
`ON`, `RE`, `AN`, `CP`, `SO`, `US`.
All are merely treated as "simple text" (all whitespace converted to spaces), except for `GC` which is treated as text (allowing new lines and spaces).
- Some root properties (`FF`, `GM`, `CA`, `AP`) are ignored on file input and set to fixed values on output.


Web Dev Guide
-------------

#### To embed BesoGo editor/viewer in your website
1. Link the style sheet `besogo.css` and one of the `board-*.css` sheets, which select different board themes (`std`, `alt`, `book`, `dark`). These sheets provide essential rendering parameters and can be modified to customize the layout and style.
2. Include the combined and minified javascript file `besogo-all-min.js`.
3. Add divs with the class `besogo-editor`, `besogo-viewer`, or `besogo-diagram`, e.g.,
   ```
   <div class="besogo-editor"></div>
   <div class="besogo-viewer" sgf="gameRecord.sgf"></div>
   <div class="besogo-diagram" panels="comment">
   (;FF[4]GM[1]SZ[9]AB[bb:dd]AW[ee][ff][gg]
   C[This diagram shows a 9x9 board with 9 black stones and 3 white stones placed on it.
   Be sure to properly escape HTML special characters such as &gt;, &lt;, etc.])</div>
   ```
4. Call the auto-initialization function `besogo.autoInit()` to create widgets for the above divs.

The contents of the div should either be empty or contain SGF text.
If SGF text is detected (by starting with "(;", ignoring whitespace), it will be loaded into BesoGo.
BesoGo will remove all children from the div and then insert sub-divs building up the GUI.

**Security Warning:** If your site inserts user-input SGF text directly into the inner HTML of a div, remember to escape any HTML special characters ("<", ">", "&") to avoid XSS vulnerabilities.
BesoGo will properly load the intended characters.
This is not a security vulnerability within BesoGo, but rather a reminder to use secure practices in your surrounding code.

#### Options settable via div attributes
- `sgf` URL (retrievable from same domain) of SGF file to load. If an URL is provided, BesoGo ignores the text within the div.
- `size` sets the size of the empty board loaded if no SGF text or URL is provided.
Square sizes can be specified by a single number (e.g., "19", "13") and rectangular sizes are specified by two numbers separated by a colon (e.g., "9:15").
Sizes from "1:1" to "52:52" are supported.
- `coord` sets the initial coordinate system, which is by default `none`, and can be choosen from the following options:
   - `none` no coordinate labels
   - `western` chess-style coordinates using numbers and letters
   - `eastern` coordinates using numbers and CJK symbols
   - `numeric` coordinates using only numbers
   - `corner` corner-relative system using numbers and letters
   - `eastcor` corner-relative system using numbers and CJK symbols
- `panels` space-separated list of which GUI elements are added in the GUI. The following panels are supported:
   - `control` navigation control buttons
   - `comment` comments and game info
   - `tool` editing tool selector buttons
   - `tree` game tree visualization
   - `file` save, load, and new board buttons
- `tool` sets the selected tool.
- `variants` sets the variant style, formatted as number 0-3 according to SGF standard.
- `path` string to set the initial position in the game tree of the loaded SGF. The letter `N` or `n` sets to next mode. The letter `B` or `b` sets to branch mode. One or more digits specifies the number of nodes to move forward always taking the first child (when in next mode), or the child to select (when in branch mode). All other characters are ignored but used to separate numbers. Next is the default mode. Zero in branch mode selects the last child. Examples:
   - `20` moves to the 21st node in the mainline of the game tree, which typically contains the 20th move assuming no move in the root and no empty/setup nodes besides the root.
   - `n5b1b1-1z1-1n10` does the same as `20`, but overly verbose and redundant.
   - `b2,3,0,1` navigates following the 2nd child, 3rd child, last child, and first child over four steps.
- `nokeys` turns off navigation key bindings if set to a truthy value. Otherwise, by default, navigation keys are enabled and the `tabindex` attribute of the container div is set to `0` (to enable keypress focus), if not already set.
- `noresize` turns off auto-resizing behavior of the widget. Otherwise, by default, the widget will automatically resize and reorient (switching between landscape and portrait mode) based on the width of its parent node and the height of the display window.


Code Doc
--------

The js files can be combined into a single file in lexical order (the only requirement is that `besogo.js` should be first)
```
cat *.js > besogo-all.js
```

Use the [Google Closure Compiler](https://closure-compiler.appspot.com/) on this combined file to produce the minified version `besogo-all-min.js`

Everything should be encapsulated within the name space object `besogo`

#### Outline of source files
- `besogo.js` establishes name space, core functions `autoInit` and `create` compose the editor and GUI objects
- `besoso.css` defines GUI layout and main rendering options
- `besogo-std.css` standard board theme
- `besogo-alt.css` alternate board theme
- `besogo-book.css` book (black and white) board theme 
- `besogo-dark.css` dark (night mode) board theme
- `editor.js` core editor logic managing game tree, handling input from GUI panels, and notifying GUI panels of state changes
- `gameRoot.js` data structure that internally represents the game tree
- `boardDisplay.js` essential board display GUI panel
- `controlPanel.js` GUI panel for navigation control buttons
- `commentPanel.js` GUI panel for comments and game info
- `toolPanel.js` GUI panel for tool selector buttons
- `treePanel.js` GUI panel for game tree visualization
- `filePanel.js` GUI panel for save, load, and new board buttons
- `coord.js` utility functions for generate coordinate system labels
- `svgUtil.js` utility SVG element creation functions
- `parseSgf.js` parser to extract data structure from SGF text
- `loadSgf.js` loads SGF data structure into game tree
- `saveSgf.js` composes SGF file from game tree data structure


Change Log
----------

#### 0.0.1-alpha
- Tweaked widget auto-resize behavior
- Refactored for CSS based board themes
- Removed board hover effects for touch devices (fixes iOS issues)
- History remembered during tree navigation
- Favicon added to repository

#### 0.0.0-alpha
- Initial preview release


Copying and License
-------------------

Copyright (C) 2015-2016  Ye Wang <yewang15@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

See the LICENSE file in the source distribution for a copy of the license.

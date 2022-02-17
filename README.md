BesoGo
======

Embeddable SGF player for the game of Go (aka Weiqi, Baduk)

Written in JavaScript, CSS, and HTML5, with no dependencies on other libraries

Free software released under the MIT License.
Some bundled assets are copyright by other authors and available under [Creative Commons](https://creativecommons.org) licensing terms.
See "Copying and License" section for further details.


User Notes
----------

BesoGo can be used as a web-based SGF editor, an embeddable SGF viewer, or a board diagram renderer

#### Online usage

SGF editor based on the latest code snapshot at <https://yewang.github.io/besogo/testing.html>

With realistic board rendering <https://yewang.github.io/besogo/testing.html?theme=wood&realstones=on>

Other experimental themes include:
- <https://yewang.github.io/besogo/testing.html?theme=bold>
- <https://yewang.github.io/besogo/testing.html?theme=book>
- <https://yewang.github.io/besogo/testing.html?theme=dark>

SGF editor based on the latest release (lagging behind the latest snapshot) at <https://yewang.github.io/besogo/stable.html>

#### Offline usage

Download the source distribution and open `testing.html`

#### Navigation key bindings
- `left` previous node
- `right` next node
- `shift+left` previous branching node
- `page up` jump back 10 nodes
- `page down` jump forward 10 nodes
- `home` jump to first node
- `end` jump to last node
- `delete` remove current branch

Shift-clicking with the auto-move/navigate tool will jump to the move that plays at that point

When entering moves, overwrite, suicide, and basic ko moves are not allowed, but can be enabled by holding down `ctrl` while clicking

BesoGo supports the [SGF standard](https://www.red-bean.com/sgf/) for Go game records.
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

See <https://yewang.github.io/besogo/> and <https://yewang.github.io/besogo/fixedSize.html> for some examples of how to embed BesoGo. See <https://yewang.github.io/besogo/testing.html> for an example full window interface for the editor.

#### To embed BesoGo editor/viewer in your website
1. Link the style sheet `css/besogo.css` and one of the `css/board-*.css` sheets, which select different board themes (`simple`, `flat`, `book`, `dark`, `wood`, etc.). These sheets provide essential rendering parameters and can be modified to customize the layout and style.
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
- `sgf` sets the URL (from same domain or server with CORS enabled) of the SGF file to load. If an URL is provided, BesoGo ignores the text within the div.
- `size` sets the size of the empty board loaded if no SGF text or URL is provided.
Square sizes can be specified by a single number (e.g., "19", "13") and rectangular sizes are specified by two numbers separated by a colon (e.g., "9:15"). Sizes from "1:1" to "52:52" are supported.
- `realstones` sets board rendering to use realistic stone images if set to a truthy value. Otherwise, defaults to flat SVG stones.
- `shadows` selects whether shadows will be added beneath the stones. If omitted or set to `auto`, shadows will be added for realistic stones, but not for SVG stones. If set to `off`, shadows will not be added. If set to any other truthy value, shadows will always be added.
- `coord` sets the initial coordinate system, which is by default `none`, and can be choosen from the following options:
   - `none` no coordinate labels
   - `western` chess-style coordinates using numbers and letters
   - `eastern` coordinates using numbers and CJK symbols
   - `numeric` coordinates using only numbers
   - `corner` corner-relative system using numbers and letters
   - `eastcor` corner-relative system using numbers and CJK symbols
- `panels` plus-separated list of which GUI elements are added in the GUI. The following panels are supported:
   - `control` navigation control buttons
   - `names` player names, ranks, and captures
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
- `nowheel` turns off mousewheel navigation if set to a truthy value. Otherwise, by default, mousewheel navigation is enabled.
- `resize` sets the resizing behavior of the widget, defaulting to `auto` if not set, with the following options:
   - `auto` is the default responsive resizing behavior, which depends on the settings of the following companion parameters
      - `orient` can be set to `landscape`, `portrait`, `auto` or `view`
         - `portrait` or `landscape` fixes the orientation of the widget as specified
         - `auto` is the default behavior, which switches from `landscape` to `portrait` if the parent container width is less than `transwidth`
         - `view` is the same as `auto`, but also switches from `landscape` to `portrait` if the parent container width is less than viewport height
      - `transwidth` sets the width to transition from `landscape` to `portrait` for `auto` and `view` orientation modes, defaulting 600 pixels if not set
      - `maxwidth` sets a limit on the maximum width, otherwise the widget will fill the width of the parent container if omitted
      - `portratio` sets the height-to-width ratio for `portrait` mode, expressed as a percentage. Defaults to 200% if not set. If set to a truthy value that converts to `NaN`, then the GUI panels will have a compact automatic height.
      - `landratio` sets the width-to-height ratio for `landscape` mode, expressed as a percentage. Defaults to 200% if not set.
      - `minpanelswidth` sets the smallest width for the GUI panels in `landscape` mode, where the board and widget height would be shrunk to ensure that this minimum is met, defaulting to 350 pixels if not set
      - `minpanelsheight` sets the smallest height for the GUI panels in `portrait` mode (if height is computed using `portratio`), defaulting to 400 pixels if not set
   - `fill` is another responsive resizing behavior designed for filling and only using the entire window. It toggles between portrait and landscape modes automatically depending on the aspect ratio. It also makes use of the `minpanelswidth` and `minpanelsheight` to ensure that the panels are visible if needed and the aspect ratio is too squarish.
   - `fixed` requires the width and height of the container div to be set, as they will be accordingly
   - `none` or any other truthy value that is not `auto` or `fixed` disables all resizing


Code Doc
--------

Everything is (or at least should be) encapsulated within the name space object `besogo`

#### Combining and minifying the JavaScript

`./build.sh` automatically generates the combined and minified versions (requires shell, cat, curl, and internet access)

Alternatively, you can manually combine and minify as follows

1. Cobmine the js files into a single file (just ensure that `besogo.js` is first), e.g., with `cat js/* > besogo.all.js`
2. Use the [Google Closure Compiler](https://closure-compiler.appspot.com/) to minify the combined file

#### JavaScript files in `js/` folder
- `besogo.js` establishes name space, core functions `autoInit` and `create` compose the editor and GUI objects
- `editor.js` core editor logic managing game tree, handling input from GUI panels, and notifying GUI panels of state changes
- `gameRoot.js` data structure that internally represents the game tree
- `boardDisplay.js` essential board display GUI panel
- `controlPanel.js` GUI panel for navigation control buttons
- `namesPanel.js` GUI panel for player names, ranks, and captures
- `commentPanel.js` GUI panel for comments and game info
- `toolPanel.js` GUI panel for tool selector buttons
- `treePanel.js` GUI panel for game tree visualization
- `filePanel.js` GUI panel for save, load, and new board buttons
- `coord.js` utility functions for coordinate system labels
- `svgUtil.js` utility functions for SVG composition
- `parseSgf.js` parses and extracts data structure from SGF text
- `loadSgf.js` loads SGF data structure into game tree
- `saveSgf.js` composes SGF file from game tree data structure

#### CSS files in `css/` folder
- `besogo.css` defines GUI layout and main rendering options
- `besogo-fill.css` defines style for filling entire window, used by testing.html
- `board-flat.css` default flat board theme
- `board-bold.css` bold board theme
- `board-book.css` book (black and white) board theme
- `board-dark.css` dark (night mode) board theme
- `board-wood.css` wood grain board theme
- `board-eidogo.css` board theme mimicking EidoGo
- `board-glift.css` board theme mimicking Glift
- `board-kibitz.css` board theme mimicking GoKibitz
- `board-sensei.css` board theme mimicking Sensei's Library

#### Graphical assets in `img/` folder
These images are used for realistic board and stone rendering
- `black0.png` ... `black3.png` black stone slate textures
- `white0.png` ... `white10.png` white stone shell textures
- `wood.jpg` and `wood-light.jpg` wood board textures
- `shinkaya1.jpg` ... `shinkaya4.jpg` shinkaya board textures


Change Log
----------

#### 0.0.2-alpha
- Redesigned responsive behavior
- Added realistic stone and board rendering
- Added and modified themes
- Added mousewheel navigation
- Converted index.html to demo page, moved old index.html to stable.html
- Added fixedSize.html examples page
- Fixed minor tree panel bug
- Tweaked margin for coordinate labels slightly
- Added build script for generating combined and minified releases
- Reorganized code into folders

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

#### Software Code

The following copyright and license terms only apply to the software code, which consists of all of the files **excluding** the contents of the `img/` directory.

MIT License

Copyright (c) 2015-2018  Ye Wang <yewang15@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

#### Graphical Assets

The contents of the `img/` directory are copyright by other authors and available under the license terms specified below

The following images are from the [go-assets](https://github.com/atarnowsky/go-assets) repository, available under a [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/) license.
Copyright (C) 2016 Andreas Tarnowsky <andreas.tarnowsky@googlemail.com>
- 4 black stone images `img/black0.png` ... `img/black3.png`
- 11 white stone images `img/white0.png` ... `img/white10.png`

The following images are from (or derived from) the [jgoboard](https://github.com/jokkebk/jgoboard) repository, available under a [Creative Commons Attribution-NonCommercial 4.0 International](https://creativecommons.org/licenses/by-nc/4.0/) license.
Copyright (C) 2013 Joonas Pihlajamaa <github@joonaspihlajamaa.com>
- `img/shinkaya1.jpg` and its derivatives `img/shinkaya2.jpg` ... `img/shinkaya4.jpg`

The following images are courtesy of tozgrec (OGS user).
-  `img/wood.jpg` and `img/wood-light.jpg`

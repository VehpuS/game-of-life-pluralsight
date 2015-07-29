/*jslint browser: true*/
// Global Helpers
function toInt(x) {
	return +(x);
}

// Helpers
function clearHtml(htmlObj) {
	htmlObj.innerHTML = "";
}

// Game logic
(function() {
	// Class definition with private attributes / methods
	var _ = this.Life = function(starting_board, gameRules) {
		// A 2x2 array of values 1 (alive) or 0 (dead)
		this.starting_board = boardCopy(starting_board);

		this.height = this.starting_board.length;
		this.width = this.starting_board[0].length;

		this.gameRules = gameRules;

		this.previous_boards = [];
		this.board = boardCopy(starting_board);
	};

	// Helpers
	function boardCopy(board) {
		// copies rows pointing to references of columents
		return board.slice().map(function(row) {return row.slice();});
	}

	function getNumNeighbors(board, x, y, wrapped, width, height) {
		var previousX = wrapped ? (x - 1 + width) % width : x - 1;
		var nextX = wrapped ? (x + 1) % width : x + 1;

		var previousY = wrapped ? (y - 1 + height) % height : y - 1;
		var nextY = wrapped ? (y + 1) % height : y + 1;

		var prevRow = board[previousY] || [];
		var currRow = board[y];
		var nextRow = board[nextY] || [];
		
		return [prevRow[previousX],	prevRow[x],	prevRow[nextX],
				currRow[previousX],				currRow[nextX],
				nextRow[previousX],	nextRow[x],	nextRow[nextX]]
				.reduce(function(prev, cur) {
					return prev + !!cur;
				}, 0);
	}

	// Scope constants
	var alive = true;
	var dead = false;

	// Public methods
	_.prototype = {
		next: function() {
			var previoud_board = boardCopy(this.board);
			var extendWidth = false;
			var extendHeight = false;

			for (var y = 0; y < this.height; y++) {
				for (var x = 0; x < this.width; x++) {
					var neighbors = getNumNeighbors(previoud_board, x, y, this.gameRules === "wrapped", this.width, this.height);
					var isAlive = !!this.board[y][x];
					if (isAlive && (neighbors > 3 || neighbors < 2)) {
						this.board[y][x] = dead;
					} else if (!isAlive && neighbors === 3) {
						this.board[y][x] = alive;

						// if (this.gameRules ==='dynamic' && y == this.height - 1) {
						// 	extendHeight = true;
						// }
						// if (this.gameRules ==='dynamic' && y == this.width - 1) {
						// 	extendWidth = true;
						// }
					}
				}
			}

			this.previous_boards.push(previoud_board);

			// Need to change external control as well
			// if (extendHeight) {
			// 	this.height++;
			// }
			// if (extendWidth) {
			// 	this.width++;
			// }
		},

		back: function() {
			if (this.previous_boards.length > 0){
				this.board = this.previous_boards.pop();
			}
		},

		rewind: function() {
			if (this.previous_boards.length > 0){
				this.board = this.previous_boards[0];
				this.previous_boards = [];
			}
		},

		toString: function() {
			// join all cells in a row with a space, and all rows with a new line.
			return this.board.map(
				function(row) { 
					return row.map(
							function(cell) {
								return toInt(cell);
							}
						).join(' ');
				}
			).join('\n');
		},

		getBoard: function() {
			return this.board;
		},

		setBoard: function(newBoard) {
			for (var y = 0; y < this.height; y++) {
				for (var x = 0; x < this.width; x++) {
					this.board[y][x] = !!newBoard && !!newBoard[y] && !!newBoard[y][x];
				}
			}
		},
        getPreviousBoard: function() {
            if (!this.isFirst()) {
                return this.previous_boards[this.getGeneration() - 2];
            }
        },
		isFirst: function() {
			return this.previous_boards.length === 0;
		},
		getWidth: function() {
			return this.width;
		},
		getHeight: function() {
			return this.height;
		},
		getGeneration: function() {
			return this.previous_boards.length + 1;
		}
	};
})();

// View logic - recieves the HTML object and grid dimentions and draws the game board.
(function(document) {
	// Class definition with private attributes / methods
	var _ = this.View = function(gameGrid, backButton, nextButton, rewindButton, playButton, pauseButton, generationDisplay, speedDisplay, speedControl, clearButton, boardSizeControls, widthControl, heightControl, autoFitButton, cellSizeControl, rulesControl) {
		// Will hold a <table> element that will display the game grid
		this.gameGrid = gameGrid;

		this.backButton = backButton;
		this.nextButton = nextButton;
		this.rewindButton = rewindButton;
		this.playButton = playButton;
		this.pauseButton = pauseButton;
		this.generationDisplay = generationDisplay;
		this.speedDisplay = speedDisplay;
		this.speedControl = speedControl;
		this.clearButton = clearButton;

		this.boardSizeControls = boardSizeControls;
		this.widthControl = widthControl;
		this.heightControl = heightControl;
        this.autoFitButton = autoFitButton;
		this.cellSizeControl = cellSizeControl;
		this.rulesControl = rulesControl;

		this.runGame = false;

        this.autoFit();
		this.updateSize();
		this.updateCellSize();

		this.addEventListeners();
	};

    // Helper functions
    var checkboxTouchSetup = function(gameObject, checkbox) {
        checkbox.addEventListener("touchenter", function(e) {
            console.log("touchenter");
            console.log(e);
            e.preventDefault();  // Dragging won't scroll on touch devices
            e.target.checked = !e.target.checked;
            return gameObject.initGame();
//            if (e.path[0]) {
//                console.log(e.path[0]);
//                var touch = e.path[0]; //[e.touches.length - 1];
//                console.log(touch);
//                touch.checked = !touch.checked;
//                return gameObject.initGame();
//            }
//            else {
//                console.log(e);
//            }
        });
    };
    
	// Scope constants

	// Public methods
	_.prototype = {
        autoFit: function() {
            var cellSize = this.cellSizeControl.value;
            var windowInitialWidth = document.documentElement.clientWidth - 100 > cellSize * 5 ? document.documentElement.clientWidth - 100: cellSize * 5;
            var windowInitialHeight = document.documentElement.clientHeight - 190 > cellSize * 5 ? document.documentElement.clientHeight - 190 : cellSize * 5;
            this.widthControl.value = Math.round(windowInitialWidth / cellSize);
            this.heightControl.value = Math.round(windowInitialHeight / cellSize);
        },
		updateSize: function() {
            var oldBoard = [[]];
			if (this.game) {
				oldBoard = this.game.getBoard();
			}
			
			this.width = this.widthControl.value;
			this.height = this.heightControl.value;

			this.createGrid(oldBoard);
		},
		createGrid: function(board) {
			this.checkboxes = [];

			clearHtml(this.gameGrid);
			var loadingMessage = document.createDocumentFragment();
			var message = document.createElement("section");
			message.innerHTML = "Rebuilding game grid...";
			loadingMessage.appendChild(message);
			this.gameGrid.appendChild(loadingMessage);

			/*  DocumentFragments are DOM Nodes. They are never part of the main DOM tree. 
			The usual use case is to create the document fragment, append elements to the 
			document fragment and then append the document fragment to the DOM tree. In the 
			DOM tree, the document fragment is replaced by all its children.

			Since the document fragment is in memory and not part of the main DOM tree, 
			appending children to it does not cause page reflow (computation of element's 
			position and geometry). Consequently, using document fragments often results 
			in better performance. */
			var fragment = document.createDocumentFragment();

			for (var y=0; y < this.height; y++) {
				this.checkboxes[y] = [];
				var row = document.createElement("tr");
				for (var x=0; x < this.width; x++) {
					var cell = document.createElement("td");

					var checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.className = "gameCell-" + x + "-" + y;
                    checkbox.style["width"] = checkbox.style["height"] = '' + this.cellSize + 'px';
//                    checkboxTouchSetup(this, checkbox);
					this.checkboxes[y][x] = checkbox;

					cell.appendChild(checkbox);
					row.appendChild(cell);
				}
				fragment.appendChild(row);
			}

			clearHtml(this.gameGrid);
			this.gameGrid.appendChild(fragment);

			this.initGame();

			this.game.setBoard(board);

			this.displayBoard(board);

			this.updateSpeed();

			this.pause();
		},
		getTrueFalseGameGrid: function() {
			return this.checkboxes.map(function(row) {
				return row.map(function(checkbox) {
					return checkbox.checked;
				});
			});
		},
		initGame: function() {
			this.rules = this.rulesControl.querySelector(':checked').value;
			this.game = new Life(this.getTrueFalseGameGrid(), this.rules);
			this.backButton.disabled = true;
			this.generationDisplay.value = this.game.getGeneration();
		},
		displayBoard: function(newBoard) {
			for (var y = 0; y < this.height; y++) {
				for (var x = 0; x < this.width; x++) {
					this.checkboxes[y][x].checked = !!newBoard && !!newBoard[y] && !!newBoard[y][x];
				}
			}

			this.backButton.disabled = this.game.isFirst();
			this.generationDisplay.value = this.game.getGeneration();
		},
		nextGeneration: function() {
			this.game.next();
			// this.width = this.game.getWidth();
			// this.height = this.game.getHeight();
			this.displayBoard(this.game.getBoard());
		},
		lastGeneration: function() {
			this.game.back();
			this.displayBoard(this.game.getBoard());
		},
		rewind: function() {
			this.game.rewind();
			this.displayBoard(this.game.getBoard());
		},
		updateSpeed: function() {
			this.speed = 1000 / this.speedControl.value;
			this.speedDisplay.value = '' + (1000 / this.speedControl.value) + ' m/s';
			if (this.isRunning()) {
				this.play();
			}
		},
		play: function() {
			this.pause();
			var _ = this;
			this.runGame = setInterval(function() {return _.nextGeneration();}, this.speed);
			this.playButton.style["display"] = "none";
			this.pauseButton.style["display"] = "inline-block";
		},
		pause: function() {
			if (this.runGame) {
				clearInterval(this.runGame);
			}
			this.runGame = false;

			this.pauseButton.style["display"] = "none";
			this.playButton.style["display"] = "inline-block";
		},
		clearBoard: function() {
			this.pause();
			return this.createGrid([]);
		},
		updateCellSize: function() {
			this.cellSize = this.cellSizeControl.value;
			for (var y = 0; y < this.height; y++) {
				for (var x = 0; x < this.width; x++) {
					this.checkboxes[y][x].style["width"] = this.checkboxes[y][x].style["height"] = '' + this.cellSize + 'px';
				}
			}
		},
		isRunning: function() {
			return !!this.runGame;
		},
		addEventListeners: function() {
			// Add event listeners
			var gameObject = this;

			this.gameGrid.addEventListener("mouseover", function(e) {
				if(e.buttons == 1 || e.buttons == 3) {
					e.target.checked = !e.target.checked;
					return gameObject.initGame();
			    }
			});
            // Allows for multitouch gestures
            this.gameGrid.addEventListener("touchstart", function(e) {
                if (e.touches.length == 1) { 
                    e.preventDefault();  // Dragging with one finger won't scroll on touch devices
                }
			});
            this.gameGrid.addEventListener("touchmove", function(e) {
                var touch = e.touches[0];
                var checkbox = document.elementFromPoint(touch.clientX, touch.clientY);
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                }
                if (gameObject.runGame) {
                    return gameObject.initGame();
                }
			});
            this.gameGrid.addEventListener("touchend", function() {
                return gameObject.initGame();
			});
            this.gameGrid.addEventListener("touchcancel", function() {
                return gameObject.initGame();
			});
			this.gameGrid.addEventListener("click", function() {return gameObject.initGame();});
			this.backButton.addEventListener("click", function() {return gameObject.lastGeneration();});
			this.nextButton.addEventListener("click", function() {return gameObject.nextGeneration();});
			this.rewindButton.addEventListener("click", function() {return gameObject.rewind();});
			this.playButton.addEventListener("click", function() {return gameObject.play();});
			this.pauseButton.addEventListener("click", function() {return gameObject.pause();});
			this.boardSizeControls.addEventListener("change", function() {return gameObject.updateSize();});
            this.autoFitButton.addEventListener("click", function() {
                gameObject.autoFit();
                return gameObject.updateSize();
            });
			this.cellSizeControl.addEventListener("change", function() {return gameObject.updateCellSize();});
			this.rulesControl.addEventListener("change", function() {return gameObject.initGame();});
			this.speedControl.addEventListener("change", function() {return gameObject.updateSpeed();});
			this.clearButton.addEventListener("click", function() {return gameObject.clearBoard();});
		}
	};
})(document);

var gameGrid = document.getElementsByClassName("gameGrid")[0];
var backButton = document.getElementsByClassName('back')[0];
var nextButton = document.getElementsByClassName('next')[0];
var rewindButton = document.getElementsByClassName('rewind')[0];
var playButton = document.getElementsByClassName('play')[0];
var pauseButton = document.getElementsByClassName('pause')[0];
var generationDisplay = document.getElementsByClassName('generationDisplay')[0];
var speedDisplay = document.getElementsByClassName('speedDisplay')[0];
var speedControl = document.getElementsByClassName('speedControl')[0];
var clearButton = document.getElementsByClassName('clear')[0];
var boardSizeControls = document.getElementsByClassName('board-size')[0];
var widthControl = document.getElementsByClassName('widthControl')[0];
var heightControl = document.getElementsByClassName('heightControl')[0];
var autoFitButton = document.getElementsByClassName('autoFit')[0];
var cellSizeControl = document.getElementsByClassName('cellSizeControl')[0];
var rulesControl = document.getElementsByClassName('rulesControl')[0];

// Setup initial game
var mainGame = new View(gameGrid,
						backButton,
						nextButton,
						rewindButton,
						playButton,
						pauseButton,
						generationDisplay,
						speedDisplay,
						speedControl,
						clearButton,
						boardSizeControls,
						widthControl,
						heightControl,
                        autoFitButton,
						cellSizeControl,
						rulesControl);

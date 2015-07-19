// Global Helpers
function toBool(x) {;
	return !!(x);
};

function toInt(x) {
	return +(x);
};

function toStr(x) {
	return (x) + '';
};

// Helpers
function clearHtml(htmlObj) {
	htmlObj.innerHTML = "";
}

// Game logic
(function() {
	// Class definition with private attributes / methods
	var _ = self.Life = function(starting_board, gameRules) {
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
	};

	function getNumNeighbors(board, x, y, wrapped, width, height) {
		var previousX = wrapped ? (x - 1 + width) % width : x - 1;
		var nextX = wrapped ? (x + 1) % width : x + 1;

		var previousY = wrapped ? (y - 1 + height) % height : y - 1;
		var nextY = wrapped ? (y + 1) % height : y + 1;

		var prevRow = board[previousY] || []
		var currRow = board[y]
		var nextRow = board[nextY] || []
		
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
			previoud_board = boardCopy(this.board);
			extendWidth = false;
			extendHeight = false;

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
(function() {
	// Class definition with private attributes / methods
	var _ = self.View = function(gameGrid, backButton, nextButton, rewindButton, playButton, pauseButton, generationDisplay, speedDisplay, speedControl, clearButton, boardSizeControls, widthControl, heightControl, cellSizeControl, rulesControl) {
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
		this.cellSizeControl = cellSizeControl;
		this.rulesControl = rulesControl;

		this.runGame = false;

		this.updateSize();
		this.updateCellSize();

		this.addEventListeners();
	};

	// Scope constants

	// Public methods
	_.prototype = {
		updateSize: function() {
			if (this.game) {
				oldBoard = this.game.getBoard();
			} else {
				oldBoard = [[]];
			}
			
			this.width = this.widthControl.value;
			this.height = this.heightControl.value;

			this.createGrid(oldBoard);
		},
		createGrid: function(board) {
			this.checkboxes = []

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
			fragment = document.createDocumentFragment();

			for (var y=0; y < this.height; y++) {
				this.checkboxes[y] = [];
				var row = document.createElement("tr");
				for (var x=0; x < this.width; x++) {
					var cell = document.createElement("td");

					var checkbox = document.createElement("input");
					checkbox.type = "checkbox";
					checkbox.className = "gameCell-" + x + "-" + y;
					checkbox.style["width"] = checkbox.style["height"] = '' + this.cellSize + 'px';
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
				})
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
					this.checkboxes[y][x].style["width"] = this.checkboxes[y][x].style["height"] = '' + this.cellSize + 'px';;
				}
			}
		},
		isRunning: function() {
			return !!this.runGame;
		},
		addEventListeners: function() {
			// Add event listeners
			gameObject = this;

			this.gameGrid.addEventListener("mouseover", function(e) {
				if(e.buttons == 1 || e.buttons == 3) {
					e.target.checked = !e.target.checked;
					return gameObject.initGame();
			    }
			});
			this.gameGrid.addEventListener("click", function() {return gameObject.initGame();});

			this.backButton.addEventListener("click", function() {return gameObject.lastGeneration();});
			this.nextButton.addEventListener("click", function() {return gameObject.nextGeneration();});
			this.rewindButton.addEventListener("click", function() {return gameObject.rewind();});
			this.playButton.addEventListener("click", function() {return gameObject.play();});
			this.pauseButton.addEventListener("click", function() {return gameObject.pause();});
			this.boardSizeControls.addEventListener("change", function() {return gameObject.updateSize();});
			this.cellSizeControl.addEventListener("change", function() {return gameObject.updateCellSize();})
			this.rulesControl.addEventListener("change", function() {return gameObject.initGame();});
			this.speedControl.addEventListener("change", function() {return gameObject.updateSpeed();});
			this.clearButton.addEventListener("click", function() {return gameObject.clearBoard();});
		}
	}
})();

gameGrid = document.getElementsByClassName("gameGrid")[0];
backButton = document.getElementsByClassName('back')[0];
nextButton = document.getElementsByClassName('next')[0];
rewindButton = document.getElementsByClassName('rewind')[0];
playButton = document.getElementsByClassName('play')[0];
pauseButton = document.getElementsByClassName('pause')[0];
generationDisplay = document.getElementsByClassName('generationDisplay')[0];
speedDisplay = document.getElementsByClassName('speedDisplay')[0];
speedControl = document.getElementsByClassName('speedControl')[0];
clearButton = document.getElementsByClassName('clear')[0];
boardSizeControls = document.getElementsByClassName('board-size')[0];
widthControl = document.getElementsByClassName('widthControl')[0];
heightControl = document.getElementsByClassName('heightControl')[0];
cellSizeControl = document.getElementsByClassName('cellSizeControl')[0];
rulesControl = document.getElementsByClassName('rulesControl')[0];

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
						cellSizeControl,
						rulesControl);

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
	var _ = self.Life = function(starting_board) {
		// A 2x2 array of values 1 (alive) or 0 (dead)
		this.starting_board = boardCopy(starting_board);

		this.height = this.starting_board.length;
		this.width = this.starting_board[0].length;

		this.previous_boards = [];
		this.board = boardCopy(starting_board);
	};

	// Helpers
	function boardCopy(board) {
		// copies rows pointing to references of columents
		return board.slice().map(function(row) {return row.slice();});
	};

	function getNumNeighbors(board, x, y) {
		var prevRow = board[y - 1] || []
		var currRow = board[y]
		var nextRow = board[y + 1] || []

		return [prevRow[x - 1],	prevRow[x],	prevRow[x + 1],
				currRow[x - 1],				currRow[x + 1],
				nextRow[x - 1],	nextRow[x],	nextRow[x + 1]]
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

			for (var y = 0; y < this.height; y++) {
				for (var x = 0; x < this.width; x++) {
					var neighbors = getNumNeighbors(previoud_board, x, y);
					var isAlive = this.board[y][x];
					if (isAlive && (neighbors > 3 || neighbors < 2)) {
						this.board[y][x] = dead;
					} else if (!isAlive && neighbors === 3) {
						this.board[y][x] = alive;
					}
					
				}
			}

			this.previous_boards.push(previoud_board);
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
		}
	};
})();

// View logic - recieves the HTML object and grid dimentions and draws the game board.
(function() {
	// Class definition with private attributes / methods
	var _ = self.View = function(gameGrid) {
		// Will hold a <table> element that will display the game grid
		this.table = gameGrid;
	};

	// Scope constants

	// Public methods
	_.prototype = {
		updateSize: function(width, height) {
			this.height = height;
			this.width = width;

			this.checkboxes = []

			clearHtml(this.table);
			var loadingMessage = document.createDocumentFragment();
			var message = document.createElement("section");
			message.innerHTML = "Rebuilding game grid...";
			loadingMessage.appendChild(message);
			this.table.appendChild(loadingMessage);

			this.createGrid();
		},
		createGrid: function() {
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
					this.checkboxes[y][x] = checkbox;

					cell.appendChild(checkbox);
					row.appendChild(cell);
				}
				fragment.appendChild(row);
			}

			clearHtml(this.table);
			this.table.appendChild(fragment);

			this.initGame();
		},
		getTrueFalseGameGrid: function() {
			return this.checkboxes.map(function(row) {
				return row.map(function(checkbox) {
					return checkbox.checked;
				})
			});
		},
		initGame: function() {
			// TODO: disable back button
			this.game = new Life(this.getTrueFalseGameGrid());
		},
		displayBoard: function() {
			var newBoard = this.game.getBoard();

			for (var y = 0; y < this.height; y++) {
				for (var x = 0; x < this.width; x++) {
					this.checkboxes[y][x].checked = newBoard[y][x];
				}
			}
		},
		nextGeneration: function() {
			// TODO: enable back button
			this.game.next();
			this.displayBoard();
		},
		lastGeneration: function() {
			// TODO: check if back button should be disabled
			this.game.back();
			this.displayBoard();
		},
		rewind: function() {
			// TODO: check if back button should be disabled
			this.game.rewind();
			this.displayBoard();
		}
	}
})();

function updateGameGridSize() {
	var newWidth = document.getElementsByClassName('widthControl')[0].value;
	var newHeight = document.getElementsByClassName('heightControl')[0].value;
	mainGame.updateSize(newWidth, newHeight);
}


// Setup initial game
var boardSizeControls = document.getElementsByClassName('board-size')[0];

var nextButton = document.getElementsByClassName('next')[0];
var backButton = document.getElementsByClassName('back')[0];
var rewindButton = document.getElementsByClassName('rewind')[0];

var gameGrid = document.getElementsByClassName('gameGrid')[0];

var mainGame = new View(document.getElementsByClassName("gameGrid")[0]);
updateGameGridSize();

boardSizeControls.addEventListener("change", updateGameGridSize);
gameGrid.addEventListener("click", function() {
							mainGame.initGame();
						});
nextButton.addEventListener("click", function() {
							mainGame.nextGeneration();
						});
backButton.addEventListener("click", function() {
							mainGame.lastGeneration();
						});
rewindButton.addEventListener("click", function() {
							mainGame.rewind();
						});

// Testing functions
function testGameLogic() {
	var game = new Life([[false,	true,	false],
					 	 [false,	true,	false],
				 		 [false,	true,	false]]);

	console.log(toStr(game));
	game.next();
	console.log(toStr(game));
	game.back();
	console.log(toStr(game));
}

function testGameView() {
	this.gameGrid = new View(document.getElementsByClassName("gameGrid")[0], 3, 3);
}
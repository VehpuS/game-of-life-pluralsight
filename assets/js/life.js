(function() {
var alive = 1;
var dead = 0;
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
// Public methods
_.prototype = {
	next: function() {
		previoud_board = boardCopy(this.starting_board);

		for (var y = 0; y < this.height; y++) {
			for (var x = 0; x < this.width; x++) {
				var neighbors = getNumNeighbors(previoud_board, x, y);
				var isAlive = toBool(this.board[y][x]);
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

	toString: function() {
		// join all cells in a row with a space, and all rows with a new line.
		return this.board.map(function(row) { return row.join(' ');}).join('\n');
	}
};
})();

function toBool(x) {
	return !!(x);
};

function toInt(x) {
	return +(x);
};

function toStr(x) {
	return (x) + '';
};

var game = new Life([[0,1,0],
					 [0,1,0],
				 	 [0,1,0]]);

console.log(toStr(game));
game.next();
console.log(toStr(game));
game.back();
console.log(toStr(game));

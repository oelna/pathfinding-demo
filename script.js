'use strict';

const generateId = function (size) {
	if (!size) size = 10;
	const id = [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
	return id;
}

const Tile = class {
	constructor(params) {
		this.uid = generateId();

		this.walkable = (params && params.walkable !== undefined) ? !!params.walkable : true;
		this.isExit = false;
		this.isEntrance = false;
		this.y = (params && params.y !== undefined) ? params.y : null;
		this.x = (params && params.x !== undefined) ? params.x : null;
		this.type = (params && params.type !== undefined) ? params.type : 'ground';
		
		this.isStart = null;
		this.isEnd = null;
		this.isPath = null;
		this.isInRange = null;

		this.characters = [];
		this.items = [];
	}
};

const Item = class {
	constructor(params) {
		this.uid = generateId();
		this.consumable = null;
	}
};

class Weapon extends Item {
	constructor(params) {
		super(params);
		this.damage = 5;
	}
};

const Character = class {
	constructor(params) {
		this.uid = generateId();
		this.health = 5;
		this.range = 4;
		this.tile = null;
		this.selected = false;
		this.moving = false;
		this.target = null;
		this.pastSteps = [];
		this.futureSteps = [];
	}

	step (oldTile, newTile) {
		oldTile.characters = []; // todo: filter by uid instead
		newTile.characters.push(this);
		this.tile = newTile;

		// detect lava
		if (newTile.type == 'lava') {
			console.warn('standing in lava!');
		}

		// handle events
		if (newTile.isExit) {
			console.log('exiting level');
			game.room += 1;
			game.generateGrid(null, game.gridWidth, game.gridHeight);
		}
	}

	move () {
		this.moving = true;
		const testInterval = setInterval(function (self) {

			if (self.futureSteps.length > 0) {
				const nextTileCoords = self.futureSteps.shift();
				self.pastSteps.push(nextTileCoords);
				const nextTile = game.getTile(nextTileCoords[0], nextTileCoords[1]);
				console.log('moving to', nextTile);
				self.step(self.tile, nextTile);

				if (self.futureSteps.length == 0) {
					console.log('no further steps');
					clearInterval(testInterval);
					game.clearRange();
					game.clearPath();
					game.highlightRange(self.tile, self.range);
					self.moving = false;
				}
			}

			return;
		}, 500, this);
	}
};

class Player extends Character {
	constructor(params) {
		super(params);
	}
};

const game = new Vue({
	'el': '#app',
	'data': {
		'room': 1,
		'gridWidth': 12,
		'gridHeight': 12,
		'grid': [],
		'PFgrid': null,
		'PFfinder': null,
		'start': null,
		'end': null,
		'moving': false,
		'characters': [],
		'player': null
	},
	'created': function () {

		this.player = new Player();
		this.characters.push(this.player);

		this.generateGrid(null, this.gridWidth, this.gridHeight);

		console.log('init');
	},
	'methods': {
		'matrixFromTiles': function (grid) {
			if (!grid) return [];
			
			const matrix = grid.map(function (row) {
				const cells = row.map(function (cell) {
					return cell.walkable ? 0 : 1;
				});
				return cells;
			});

			return matrix;
		},
		'generateGrid': function (event, width, height) {
			if (!width) width = this.gridWidth;
			if (!height) height = this.gridHeight;

			console.log('regenerate grid', width, height);

			this.grid = [];
			this.PFgrid = null;

			const rows = [];
			for (let i = 0; i < height; i++) {
				const row = [];
				for (let ii = 0; ii < width; ii++) {
					const walkable = (Math.random()>=0.8) ? false : true;
					let cell = new Tile({
						'y': i,
						'x': ii,
						'walkable': walkable,
						'type': walkable ? 'ground' : 'wall'
					});
					row.push(cell);
				}
				rows.push(row);
			}

			this.grid = rows;

			// clear some points
			this.grid[0][0].walkable = true;
			this.grid[width-1][height-1].walkable = true;

			const matrix = this.matrixFromTiles(this.grid);
			this.PFgrid = new PF.Grid(matrix);

			// this.PFgrid.setWalkableAt(0, 0, true);
			// this.PFgrid.setWalkableAt(this.gridWidth-1, this.gridHeight-1, true);

			// init finder algo
			this.PFfinder = new PF.AStarFinder({
				'allowDiagonal': false
			});

			this.clearAll();

			let lava = this.getTile(3, 2);
			lava.walkable = true;
			lava.type = 'lava';

			// set a player start position
			// todo: do this somewhere else sensible
			const startPosition = this.getFreeTile();
			// this.setStart(startPosition);
			this.player.tile = startPosition;
			startPosition.characters.push(this.player);

			// set an exit position
			const exitPosition = this.getFreeTile();
			this.setExit(exitPosition);
		},
		'makePath': function (start, end) {
			if (!start) start = this.start;
			if (!end) start = this.end;

			if (start == null || end == null) {
				console.error('you must define a start and end point!');
				return;
			}

			if (start.uid == end.uid) {
				console.error('select different start and end positions!');
				return;
			}

			const path = this.findPath(start, end);

			if (path.length > 0) {
				for (var i = 0; i < path.length; i++) {
					const tile = this.getTile(path[i][0], path[i][1]);
					tile.isPath = true;
				}
			} else {
				console.warn('could not calculate a path:', tile1, tile2);
			}

			return path;
		},
		'findPath': function (tile1, tile2) {
			if (!tile1 || !tile2) {
				console.error('you must provide two valid tiles!');
				return;
			}

			const gridClone = this.PFgrid.clone();
			const path = this.PFfinder.findPath(tile1.x, tile1.y, tile2.x, tile2.y, gridClone);
			
			return path;
		},
		'clearPath': function () {
			if (!this.$el) return;

			for (const row of this.grid) {
				for (const cell of row) {
					cell.isPath = false;
				}
			}
		},
		'clearRange': function () {
			if (!this.$el) return;

			for (const row of this.grid) {
				for (const cell of row) {
					cell.isInRange = false;
				}
			}
		},
		'clearAll': function () {
			if (!this.$el) return;

			this.start = null;
			this.end = null; // todo: unify this into tile class

			for (const row of this.grid) {
				for (const cell of row) {
					cell.isStart = false;
					cell.isEnd = false;
					cell.isPath = false;
					cell.isInRange = false;
				}
			}
		},
		'getDistance': function (tile1, tile2) { // manhattan distance
			let xs = Math.abs(tile1.x - tile2.x);
			let ys = Math.abs(tile1.y - tile2.y);		

			return xs + ys;
		},
		'getRadius3': function (tile, radius) {
			if (!radius) radius = 4;
			x = Math.random() * 2 * radius - radius;
			ylim = Math.sqrt(radius * radius - x * x);
			y = Math.random() * 2 * ylim - ylim;
		},
		'getRadius': function (tile, radius) {
			const scriptBegin = performance.now();
			let area = [];
			for (const row of this.grid) {
				for (const cell of row) {
					if (cell.y < (tile.y-radius) || cell.y > (tile.y+radius)) {
						// skip cells that are known to be too far
						continue;
					}

					const path = this.findPath(tile, cell);
					const distance = path.length-1;

					if (distance <= radius && distance > 0) {
						area.push(cell);
					}
				}
			}
			const scriptEnd = performance.now();
			console.info('script getRadius3 took', (scriptEnd-scriptBegin).toFixed(2), 'ms');

			return area;
		},
		'getRadius2': function (tile, radius) {
			let area = [];
			console.log('solve for center', tile.y);
			// only work on tiles that are relevant
			for (let i = (tile.y-radius); i <= (tile.y+radius); i++) {
				let row = [];
				if (i == (tile.y-radius) || i == (tile.y+radius)) {
					console.log(i, 'is a top or bottom point');
					row.push([tile.x,i]);
				} else {
					const d = Math.pow(radius, 2) - Math.pow((i - tile.x), 2);

					const py = [
						-Math.sqrt(d) + tile.y,
						Math.sqrt(d) + tile.y
					]

					// todo: this probably has rounding errors!
					for (var j = Math.floor(py[0]); j <= Math.floor(py[1]); j++) {
						row.push([j,i]);	
					}

					
					console.log(i, py);
				}
				area.push(row);
			}
			return area;
		},
		'getTile': function (x, y) {
			return this.grid[y][x];
		},
		'getFreeTile': function () {
			const goodTiles = [];
			for (const row of this.grid) {
				for (const cell of row) {
					if (cell.walkable && !cell.isLava) {
						goodTiles.push(cell);
					}
				}
			}
			const randomIndex = Math.floor((Math.random() * (goodTiles.length)));

			return goodTiles[randomIndex];
		},
		'highlightRange': function (tile, radius) {
			// mark the available area
			const area = this.getRadius(tile, radius);
			for (const cell of area) {
				const part = this.getTile(cell.x, cell.y);
				part.isInRange = true;
			}
		},
		'setExit': function (tile) {
			console.log('selected exit tile', tile);
			tile.isExit = true;
			
		},
		'setStart': function (tile) {
			console.log('selected start', tile);
			tile.isStart = true;
			this.start = tile;

			this.highlightRange(tile, this.player.range);
		},
		'setEnd': function (tile) {
			/*
			if (!tile.isInRange) {
				console.warn('you must select a tile in range');
				return;
			}
			*/

			if (this.end) {
				this.end.isEnd = false; // deactivate old end tile
			}

			console.log('selected end', tile);
			tile.isEnd = true;
			this.end = tile;

			const distance = this.getDistance(this.start, this.end);
			console.log('distance is', distance);
			
			this.makePath();
		},
		'act': function (tile) {

			if (this.moving) {
				console.warn('wait for the turn to finish!');
				return;
			}

			if (this.end !== null) {
				// clear path and start new
				this.clearPath();
			}

			if (!tile.walkable) {
				console.warn('you must select a walkable tile');
				return;
			}

			const selected = this.getSelectedCharacters();
			for(const char of selected) {

				if (!tile.isInRange) {
					this.deselectCharacter(char);
					return;
				}

				char.target = tile;
				
				const distance = this.getDistance(char.tile, tile);
				console.log('distance is', distance);
				
				this.clearPath();
				const path = this.makePath(char.tile, tile);

				// start character animation steps
				char.futureSteps = char.futureSteps.concat(path);
				console.log(char);
				char.move();
			}

			/*
			if (this.start == null) {
				// this.setStart(tile); // disable direct positioning for now
				this.setEnd(tile);
			} else {
				this.setEnd(tile);
			}
			*/
		},
		'movePlayer': function () {
			// todo: make this use a fixed path instead of always recalculating!

			/*
			if (this.start == null || this.end == null) {
				console.error('can\'t move without valid start and end!');
				return;
			}

			this.moving = true;
			const testInterval = setInterval(function (self) {
				const path = self.findPath(self.start, self.end);

				if (path.length > 1) {
					// clear old tile
					self.start.isStart = false;
					self.start.isPath = true;
					self.start.isInRange = true;
					self.start.characters = []; // todo: make this resilient!
					
					// set new start tile
					self.start = self.getTile(path[1][0], path[1][1]);
					self.start.isStart = true;
					self.start.characters.push(this.player);

					// detect lava
					if (self.start.type == 'lava') {
						console.warn('walked across lava!');
					}
				} else {
					clearInterval(testInterval);
					self.clearAll();

					// set new start tile
					self.start = self.getTile(path[0][0], path[0][1]);
					self.start.isStart = true;
					self.highlightRange(self.start, self.player.range);

					// end UI lock
					self.moving = false;

					// handle events
					if (self.start.isExit) {
						console.log('exiting level');
						self.room += 1;
						self.generateGrid(null, this.gridWidth, this.gridHeight);
					}
				}
			}, 500, this);
			*/
		},
		'getSelectedCharacters': function () {
			const selected = this.characters.filter(function (char) {
				return char.selected;
			});

			return selected;
		},
		'deselectCharacter': function (character, event) {
			if (character.selected) {
				character.selected = false;
				character.target = null;
				this.clearRange();
				this.clearPath();
			}
		},
		'selectCharacter': function (character, event) {
			event.stopPropagation()

			// deselect other characters
			const selected = this.getSelectedCharacters();
			for(const char of selected) {
				char.selected = false;
				// todo: clear individual ranges here in the future?
			}

			if (!character.selected) {
				character.selected = true;
				this.highlightRange(character.tile, character.range);
			} else {
				character.selected = false;
				this.clearRange();
			}
		}
	}
});

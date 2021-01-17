
const Tile = class {
	constructor(params) {
		this.walkable = (params && params.walkable !== undefined) ? !!params.walkable : true;
		this.y = (params && params.y !== undefined) ? params.y : null;
		this.x = (params && params.x !== undefined) ? params.x : null;
		this.type = (params && params.type !== undefined) ? params.type : 'ground';
		this.isStart = null;
		this.isEnd = null;
		this.isPath = null;
	}
};

const game = new Vue({
	'el': '#app',
	'data': {
		'gridWidth': 9,
		'gridHeight': 9,
		'grid': [],
		'PFgrid': null,
		'PFfinder': null,
		'start': null,
		'end': null
	},
	'created': function () {

		this.generateGrid(null, this.gridWidth, this.gridHeight);

		this.PFfinder = new PF.AStarFinder({
			'allowDiagonal': false
		});

		console.log('init');
	},
	'methods': {
		'matrixFromTiles': function (grid) {
			if (!grid) return;
			
			// todo: this could probably be an easy map!
			const matrix = [];
			for (const row of grid) {
				const matrixRow = [];
				for (const cell of row) {
					matrixRow.push(cell.walkable ? 0 : 1);
				}
				matrix.push(matrixRow);
			}
			/*
			grid.map(function (row) {
				const row = 
				return [];
			});
			const matrix = grid.map(x => x * 2);
			*/

			return matrix;
		},
		'generateGrid': function (event, width, height) {
			if (!width) width = 9;
			if (!height) height = 9;

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

			this.clearPath();
		},
		'findPath': function (x1, y1, x2, y2) {
			if (this.start == null || this.end == null) {
				console.error('you must define a start and end point!');
				return;
			}

			// todo: use x and y params!
			const gridClone = this.PFgrid.clone();
			const path = this.PFfinder.findPath(this.start.x, this.start.y, this.end.x, this.end.y, gridClone);
			
			if (path.length > 0) {
				for (var i = 0; i < path.length; i++) {
					const tile = this.getTile(path[i][0], path[i][1]);
					tile.isPath = true;

					// const node = document.querySelector('#t-'+path[i][1]+'-'+path[i][0]);
					// node.classList.add('path');
				}
			} else {
				console.warn('could not calculate a path:', this.start, this.end);
			}
		},
		'clearPath': function () {
			if (!this.$el) return;
			this.start = null;
			this.end = null; // todo: unify this into tile class

			for (const row of this.grid) {
				for (const cell of row) {
					cell.isStart = false;
					cell.isEnd = false;
					cell.isPath = false;
				}
			}
			console.log('cleared path');
		},
		'getTile': function (x, y) {
			return this.grid[y][x];
		},
		'act': function (x, y, tile) {
			// console.log('act on', tile);
			if (this.start !== null && this.end !== null) {
				// clear path and start new
				this.clearPath();
			}
			if (!tile.walkable) {
				console.warn('you must select a walkable tile');
				return;
			}

			if (this.start == null) {
				console.log('selected start', tile);
				tile.isStart = true;
				this.start = tile;
				// this.$el.querySelector('#t-'+tile.y+'-'+tile.x).classList.add('start');
			} else {
				console.log('selected end', tile);
				tile.isEnd = true;
				this.end = tile;
				// this.$el.querySelector('#t-'+tile.y+'-'+tile.x).classList.add('end');
			}
		}
	}
});

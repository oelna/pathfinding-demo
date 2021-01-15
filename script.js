
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
			allowDiagonal: false
		});

		console.log('init');
	},
	'methods': {
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
					let cell = (Math.random()>=0.8)? 1 : 0;
					// cell = 0;
					row.push(cell);
				}
				rows.push(row);
			}

			this.grid = rows;

			// clear some points
			this.grid[0][0] = 0;
			this.grid[width-1][height-1] = 0;

			this.PFgrid = new PF.Grid(this.grid);

			// this.PFgrid.setWalkableAt(0, 0, true);
			// this.PFgrid.setWalkableAt(this.gridWidth-1, this.gridHeight-1, true);

			this.clearPath();
		},
		'findPath': function (x1, y1, x2, y2) {
			if (this.start == null || this.end == null) {
				console.error('you must define a start and end point!');
				return;
			}
			const gridClone = this.PFgrid.clone();

			const path = this.PFfinder.findPath(this.start[0], this.start[1], this.end[0], this.end[1], gridClone);
			// console.log('path', path);
			for (var i = 0; i < path.length; i++) {
				let node = document.querySelector('#c-'+path[i][0]+'-'+path[i][1]);
				node.classList.add('path');
			}
		},
		'clearPath': function () {
			if (!this.$el) return;
			this.start = null;
			this.end = null;

			const cells = this.$el.querySelectorAll('.cell');
			for (cell of cells) {
				cell.classList.remove('path');
				cell.classList.remove('end');
				cell.classList.remove('start');
			}
			console.log('cleared path');
		},
		'setStart': function (x, y) {
			console.log('selected start', x, y);
			this.start = [x, y];
		},
		'setEnd': function (x, y) {
			console.log('selected end', x, y);
			this.end = [x, y];
		},
		'act': function (x, y) {

			if (this.start !== null && this.end !== null) {
				// clear path and start new
				this.clearPath();
			}

			if (this.start == null) {
				this.setStart(x, y);
				this.$el.querySelector('#c-'+x+'-'+y).classList.add('start');
			} else {
				this.setEnd(x, y);
				this.$el.querySelector('#c-'+x+'-'+y).classList.add('end');
			}
		}
	}
});

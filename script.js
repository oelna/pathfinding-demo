
const game = new Vue({
	'el': '#app',
	'data': {
		'gridWidth': 9,
		'gridHeight': 9,
		'grid': [
			[0, 0, 0, 1, 0],
		    [1, 0, 0, 0, 1],
		    [0, 0, 1, 0, 0]
		],
		'PFgrid': null,
		'PFfinder': null,
		'start': null,
		'end': null
	},
	'created': function () {

		this.grid = [];

		const rows = [];
		for (let i = 0; i < this.gridHeight; i++) {
			const row = [];
			for (let ii = 0; ii < this.gridWidth; ii++) {
				const cell = (Math.random()>=0.8)? 1 : 0;
				row.push(cell);
			}
			rows.push(row);
		}
		this.grid = rows;

		this.PFgrid = new PF.Grid(this.gridWidth, this.gridHeight);

		//this.PFgrid.setWalkableAt(0, 0, true);
		//this.PFgrid.setWalkableAt(this.gridWidth, this.gridHeight, true);

		//this.PFgrid = new PF.Grid(this.grid);
		// grid.setWalkableAt(0, 1, false);

		this.PFfinder = new PF.AStarFinder({
			allowDiagonal: false
		});

		console.log('init', this.PFgrid, this.PFfinder);
	},
	'methods': {
		'findPath': function (x1, y1, x2, y2) {
			if (this.start == null || this.end == null) {
				return;
			}
			const gridClone = this.PFgrid.clone();

			const path = this.PFfinder.findPath(this.start[0], this.start[1], this.end[0], this.end[1], gridClone);
			// console.log('path', path);
			for (var i = 0; i < path.length; i++) {
				let node = document.querySelector('#c-'+path[i][0]+'-'+path[i][1]);
				console.log(node);
				node.classList.add('path');
			}
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
			if (this.start == null) {
				this.setStart(x, y);
			} else {
				this.setEnd(x, y);
			}
		}
	}
});

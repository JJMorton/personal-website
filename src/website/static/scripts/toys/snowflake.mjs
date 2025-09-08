import { ToyGL, Timer } from "../toy.mjs";
import { Vector } from "../vector.mjs";

/**
 * @param {string} hex
 * @returns {number[3]}
 */
function hexToRGB(hex) {
	if (hex.substring(0, 1) === "#") hex = hex.substring(1);
	var bigint = parseInt(hex.substring(0, 6), 16);
	var r = (bigint >> 16) & 255;
	var g = (bigint >> 8) & 255;
	var b = bigint & 255;

	return [r, g, b];
}

class GLPolygon {
	/** @type Vector[] */
	vertices = [];
	/** @type WebGLBuffer | null */
	buffer = null;
	/** @type WebGL2RenderingContext */
	gl;

	/**
	 * @param {WebGL2RenderingContext} gl
	 * @param {Vector[]} [vertices]
	 */
	constructor(gl, vertices) {
		this.gl = gl;
		if (vertices) this.setVertices(vertices);
	}

	/**
	 * @returns {GLPolygon} this
	 */
	render() {
		if (!(this.buffer && this.vertices)) return;
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
		this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(0);
		this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, this.sides);
		return this;
	}

	/**
	 * @returns {number} The number of sides/vertices that this polygon has
	 */
	get sides() {
		return this.vertices.length;
	}

	/**
	 * @returns {GLPolygon} this
	 */
	createBuffer() {
		this.buffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			this.asPositionArray(),
			this.gl.STATIC_DRAW,
		);
		return this;
	}

	/**
	 * Convertes the `vertices` into a flat array of positions (2d)
	 * for the vertices of the triangles than fan from the first point.
	 * @returns {Float32Array}
	 */
	asPositionArray() {
		const vertArr = this.vertices.map((v) => Array.from(v)).flat();
		return new Float32Array(vertArr);
	}

	/**
	 * @param {Vector[]} vertices
	 * @returns {GLPolygon} this
	 */
	setVertices(vertices) {
		this.vertices = vertices;
		this.createBuffer();
		return this;
	}
}

class GLHexagon extends GLPolygon {
	/**
	 * @param {WebGL2RenderingContext} gl
	 */
	constructor(gl) {
		const N = 6;
		const vertices = new Array(N)
			.fill(0)
			.map((_, i) => ((i + 0.5) * 2 * Math.PI) / N)
			.map((theta) => new Vector([Math.cos(theta), Math.sin(theta)]));
		super(gl, vertices);
	}
}

class GLInstanced extends GLPolygon {
	/** @type number */
	nInstances;

	/**
	 * @param {object} obj
	 * @param {WebGL2RenderingContext} obj.gl
	 * @param {Vector[]} obj.vertices
	 * @param {number} nInstances
	 */
	constructor({ gl, vertices }, nInstances) {
		super(gl, vertices);
		this.nInstances = nInstances;
	}

	/**
	 * @returns {GLInstanced} this
	 */
	render() {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
		this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(0);
		this.gl.drawArraysInstanced(
			this.gl.TRIANGLE_FAN,
			0,
			this.sides,
			this.nInstances,
		);
		return this;
	}
}

/**
 * A hexagonal grid with the axial coordinate system, explained here:
 * https://www.redblobgames.com/grids/hexagons/#coordinates-axial
 */
class HexagonGrid {
	/**
	 * The number of hexagonal 'layers' from the centre (not including centre piece)
	 * @type {number}
	 */
	radius;
	/** @type {Map<string, SnowflakeCell>} */
	cells;

	/**
	 * @param {number} radius
	 */
	constructor(radius) {
		this.radius = radius;
		this.cells = new Map();
	}

	/**
	 * @param {function(number, number):SnowflakeCell} initFunc a function taking a coordinate pair (q, r)
	 * @returns {HexagonGrid} this
	 */
	init(initFunc) {
		for (const [q, r] of this) {
			this.setCell(q, r, initFunc(q, r), true);
		}
		return this;
	}

	/**
	 * Total number of cells in the grid
	 * @type {number}
	 */
	get cellCount() {
		const sumN = (N) => (N * (N + 1)) / 2;
		return 1 + sumN(this.radius) * 6;
	}

	/**
	 * @type {SnowflakeCell[]}
	 */
	get cellArray() {
		const arr = [];
		// Cartesian coordinates (i, j)
		for (let i = -this.radius; i <= this.radius; i++) {
			for (let j = -this.radius; j <= this.radius; j++) {
				// Convert to axial coordinates (q, r)
				const q = j - (i + (i & 1)) / 2;
				const r = i;
				const cell = this.getCell(q, r);
				if (cell) arr.push(cell);
			}
		}
		return arr;
	}

	/**
	 * @param {number} q
	 * @param {number} r
	 * @returns {string}
	 */
	#axialHash(q, r) {
		return q.toString() + "," + r.toString();
	}

	/**
	 * @param {number} q
	 * @param {number} r
	 * @returns {SnowflakeCell | null}
	 */
	getCell(q, r) {
		const hash = this.#axialHash(q, r);
		const cell = this.cells.get(hash);
		return cell ? cell : null;
	}

	/**
	 * @param {number} q
	 * @param {number} r
	 * @param {SnowflakeCell} value
	 * @param {boolean} [canCreate]
	 */
	setCell(q, r, value, canCreate = false) {
		if (Math.abs(q) > this.radius || Math.abs(r) > this.radius) {
			// Not a valid cell
			console.warn(`Attempted to set invalid cell (${q}, ${r})`);
			return;
		}
		const hash = this.#axialHash(q, r);
		if (!canCreate && !this.hasCell(q, r)) {
			console.error(`Cell (${q}, ${r}) does not exist`);
			return;
		}
		this.cells.set(hash, value);
	}

	/**
	 * @param {number} q
	 * @param {number} r
	 * @returns {boolean}
	 */
	hasCell(q, r) {
		return this.cells.has(this.#axialHash(q, r));
	}

	/**
	 * @param {number} q
	 * @param {number} r
	 * @returns {SnowflakeCell[]}
	 */
	neighboursOf(q, r) {
		return [
			[q, r + 1],
			[q, r - 1],
			[q + 1, r],
			[q - 1, r],
			[q + 1, r - 1],
			[q - 1, r + 1],
		]
			.filter(([q, r]) => this.hasCell(q, r))
			.map(([q, r]) => this.getCell(q, r));
	}

	/**
	 * @type {SnowflakeCell[]}
	 */
	get edgeCells() {
		const cells = [];
		const R = this.radius;
		for (let r = 0; r <= R; r++) {
			cells.push(this.getCell(-R, r));
			cells.push(this.getCell(R, -r));
		}
		for (let q = 0; q < R; q++) {
			cells.push(this.getCell(q, -R));
			cells.push(this.getCell(-q, R));
		}
		for (let x = 1; x < R; x++) {
			cells.push(this.getCell(x, R - x));
			cells.push(this.getCell(x - R, -x));
		}
		return cells;
	}

	*[Symbol.iterator]() {
		for (let q = -this.radius; q <= this.radius; q++) {
			for (
				let r = 1;
				r <= this.radius && Math.abs(r + q) <= this.radius;
				r++
			) {
				yield [q, r];
			}
			for (
				let r = 0;
				r >= -this.radius && Math.abs(r + q) <= this.radius;
				r--
			) {
				yield [q, r];
			}
		}
	}
}

/**
 * A single hexagonal grid cell, with a saturation value, as described in
 * https://doi.org/10.1016/j.chaos.2004.06.071
 */
class SnowflakeCell {
	u = 0;
	v = 0;
	u_next = 0;
	v_next = 0;

	/** @param {number} saturation */
	constructor(saturation) {
		this.v = saturation;
	}

	get s() {
		return this.u + this.v;
	}
	get frozen() {
		return this.s >= 1;
	}
}

/**
 * @param {HexagonGrid} hexgrid
 * @param {number} alpha
 * @param {number} beta
 * @param {number} gamma
 * @returns {boolean} whether the snowflake is complete or not
 */
function evolveSnowflake(hexgrid, alpha, beta, gamma) {
	for (const [q, r] of hexgrid) {
		const cell = hexgrid.getCell(q, r);
		const neighbours = hexgrid.neighboursOf(q, r);
		const isEdge = neighbours.length < 6;

		const receptive = cell.frozen || neighbours.some((c) => c.frozen);
		if (receptive) {
			// This cell is frozen or has frozen neighbours, so it is receptive
			cell.v = cell.s;
			cell.u = 0;
			// If this is an edge cell, the snowflake generation has finished, do nothing
			if (isEdge) return true;
		} else {
			cell.u = cell.s;
			cell.v = 0;
		}

		cell.u_next = cell.u;
		cell.v_next = cell.v;
	}

	for (const [q, r] of hexgrid) {
		const cell = hexgrid.getCell(q, r);
		const neighbours = hexgrid.neighboursOf(q, r);
		// Keep the edge cells fixed at beta
		if (neighbours.length < 6) {
			cell.u_next = beta;
			cell.v_next = 0;
			continue;
		}
		const receptive = cell.frozen || neighbours.some((c) => c.frozen);

		// Constant addition
		if (receptive) {
			cell.v_next = cell.v + gamma;
		}

		// Diffusion
		const u_avg = neighbours.reduce((acc, c) => acc + c.u, 0) / 6;
		cell.u_next = cell.u + 0.5 * alpha * (u_avg - cell.u);
	}

	// Finally, update all the cells to their new values
	for (const [q, r] of hexgrid) {
		const cell = hexgrid.getCell(q, r);
		cell.u = cell.u_next;
		cell.v = cell.v_next;
	}

	return false;
}

export class Snowflake extends ToyGL {
	timer = new Timer();

	/** @type {HexagonGrid} */
	grid;

	constructor({
		alpha = 0.8,
		beta = 0.7,
		gamma = 0.002,
		gridradius = 40,
	} = {}) {
		super("/static/shaders/snowflake.vs", "/static/shaders/snowflake.fs");
		this.alpha = alpha;
		this.beta = beta;
		this.gamma = gamma;
		this.gridradius = gridradius;

		this.reset();
	}

	reset() {
		this.grid = new HexagonGrid(this.gridradius).init(
			() => new SnowflakeCell(this.beta),
		);
		this.grid.setCell(0, 0, new SnowflakeCell(1));
	}

	start() {
		const gl = this.ctx;
		// Define uniforms
		this.addUniform("u_resolution", gl.uniform2fv);
		this.addUniform("u_gridradius", gl.uniform1i);
		this.addUniform("u_accentcolor", gl.uniform3fv);
		// Add attributes
		this.addAttribute("a_color", gl.DYNAMIC_DRAW, 1, gl.FLOAT, 4, 1);
		// Enable depth test
		gl.useProgram(this.program);
		gl.enable(gl.DEPTH_TEST);

		this.timer.start();

		super.start();
	}

	render() {
		if (!this.timer.isPaused) {
			evolveSnowflake(this.grid, this.alpha, this.beta, this.gamma);
		}

		// Set the colour of the cell as a proportion of the maximum saturation
		// Limit this maximum to be no lower than twice the background saturation
		const maxSat = Math.max(
			2.0 * this.beta,
			...this.grid.cellArray.map((cell) => cell.s),
		);
		const cellToCol = (cell) => (cell.s - 1) / (maxSat - 1);

		const gl = this.ctx;
		gl.useProgram(this.program);
		gl.clearColor(
			...hexToRGB(this.colours.background).map((x) => x / 255),
			1.0,
		);
		gl.clear(gl.COLOR_BUFFER_BIT);

		this.setUniform(
			"u_resolution",
			new Float32Array([this.canvas.width, this.canvas.height]),
		);
		this.setUniform("u_gridradius", this.grid.radius);
		this.setUniform(
			"u_accentcolor",
			new Float32Array(hexToRGB(this.colours.accent).map((x) => x / 255)),
		);
		this.setAttribute(
			"a_color",
			new Float32Array(this.grid.cellArray.map(cellToCol)),
		);

		const hex = new GLInstanced(new GLHexagon(gl), this.grid.cellCount);
		hex.render();
	}
}

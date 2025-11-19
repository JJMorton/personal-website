import { Mouse, MouseButton, Timer, ToyGL } from "../toy.mjs";
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

	return [r / 255.0, g / 255.0, b / 255.0];
}

const NCOLOURS = 10;

export const FractalType = {
	ZPOWERN: 0,
	NEWTON: 1,
};

export class Fractals extends ToyGL {
	// TODO: Add an explanation for each preset/some of the presets that
	// appears when selecting them.

	// TODO: Allow for zooming with a two-finger touch

	timer = new Timer();
	needsRender = true;
	/** @type {Mouse|null} */
	mouse = null;

	/** Where the user's mouse was when they began dragging the view */
	#moveOrigin = new Vector([0.0, 0.0]);
	/**
	 * The vertex buffer to render
	 * @type {WebGLBuffer|null}
	 */
	#positionBuffer = null;

	constructor() {
		super("/static/shaders/passthrough.vs", "/static/shaders/fractals.fs");
	}

	async attach(canvas) {
		await super.attach(canvas);

		// Ensure we attached to the canvas and have a valid context
		if (!this.ctx) return;
		const gl = this.ctx;

		// Create the vertex points to send to the shader program
		// This is a pixel shader, so we just draw a square covering the canvas
		const positions = new Float32Array([
			-1.0,
			-1.0,
			0.0, // bottom left
			1.0,
			-1.0,
			0.0, // bottom right
			-1.0,
			1.0,
			0.0, // top left

			1.0,
			-1.0,
			0.0, // bottom right
			1.0,
			1.0,
			0.0, // top right
			-1.0,
			1.0,
			0.0, // top left
		]);
		this.#positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(0);

		// Register uniforms from GLSL
		const onchange = () => (this.needsRender = true);
		this.addUniform("u_resolution", gl.uniform2fv, onchange);
		this.addUniform("u_time", gl.uniform1f);
		this.addUniform("u_position", gl.uniform2fv, onchange);
		this.addUniform("u_zoom", gl.uniform1f, onchange);
		this.addUniform("u_iterations", gl.uniform1i, onchange);
		this.addUniform("u_coeffs", gl.uniform4fv, onchange);
		this.addUniform("u_newton", gl.uniform1fv, onchange);
		this.addUniform("u_type", gl.uniform1i, onchange);
		this.addUniform("u_z0", gl.uniform2fv, onchange);
		this.addUniform("u_zspace", gl.uniform1i, onchange);
		this.addUniform("u_colours", gl.uniform3fv);
		this.addUniform("u_colour_stops", gl.uniform1fv);

		// Initialise uniforms to defaults for a Mandelbrot
		this.uniforms.u_position = [0.0, 0.0];
		this.uniforms.u_zoom = 0.5;
		this.uniforms.u_iterations = 200;
		this.uniforms.u_coeffs = [2.0, 0.0, 0.0, 0.0];
		this.uniforms.u_newton = [-1, 0, 0, 1, 0, 0, 0, 0, 0];
		this.uniforms.u_type = FractalType.ZPOWERN;
		this.uniforms.u_z0 = [0.0, 0.0];

		this.uniforms.u_colours = new Float32Array([
			0.18739228, 0.0771021, 0.21618875, 0.33954169, 0.13704802,
			0.52328798, 0.37471686, 0.39955665, 0.71257369, 0.48673596,
			0.63416646, 0.7625578, 0.78399101, 0.81755426, 0.83936747,
			0.8542922, 0.79097197, 0.76583801, 0.77590791, 0.53554218,
			0.42413368, 0.65832808, 0.27803211, 0.31346434, 0.41796105,
			0.10420645, 0.30278652, 0.18488036, 0.07942573, 0.21307652,
		]);
		this.uniforms.u_colour_stops = new Float32Array(10).map((v, i) =>
			Math.pow(i / 9.0, 1.0),
		);

		// Set the canvas size correctly
		this.resize();

		// Start tracking the mouse pointer
		this.mouse = new Mouse(this.canvas);

		// Moving view with the mouse
		this.canvas.addEventListener("mousedown", () => {
			this.#moveOrigin = new Vector([this.mouse.x, this.mouse.y]);
		});

		// Zooming with mouse wheel
		this.canvas.addEventListener("wheel", (e) => {
			const zoom = this.uniforms.u_zoom;
			this.uniforms.u_zoom = Math.max(
				0.5,
				zoom + zoom * e.wheelDeltaY * 0.001,
			);
			this.needsRender = true;
			e.preventDefault();
		});
	}

	resize() {
		super.resize();
		if (!this.ctx) return;
		if (this.ctx) {
			this.uniforms.u_resolution = new Float32Array([
				this.canvas.width,
				this.canvas.height,
			]);
		}
		this.needsRender = true;
	}

	start() {
		super.start();
		this.timer.start();
	}

	render() {
		if (!this.ctx) return;

		if (this.mouse.pressed === MouseButton.LEFT) {
			const mousePos = new Vector([this.mouse.x, this.mouse.y]);
			const position = new Vector([...this.uniforms.u_position]);
			this.uniforms.u_position = position.add(
				this.#moveOrigin
					.sub(mousePos)
					.divide(0.5 * this.canvas.width * this.uniforms.u_zoom),
			);
			this.#moveOrigin = mousePos;
			this.needsRender = true;
		}

		if (this.timer.isPaused && !this.needsRender) return;
		this.needsRender = false;
		if (this.uniforms.u_coeffs[3] === 0) this.timer.pause();
		this.uniforms.u_time = this.timer.time;

		const gl = this.ctx;
		gl.useProgram(this.program);
		gl.clearColor(0, 1, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#positionBuffer);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
}

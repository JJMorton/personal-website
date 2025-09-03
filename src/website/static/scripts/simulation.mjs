/*
 * Export all vue components
 */

import Checkbox from "./components/checkbox.mjs";
import Combobox from "./components/combobox.mjs";
import Gauge from "./components/gauge.mjs";
import Knob from "./components/knob.mjs";

export { Checkbox, Combobox, Gauge, Knob };

/** Timer with play and pause functionality. All units are in seconds. */
export class Timer {
	/** Time at which the timer was paused, -1 -> not paused */
	#timePaused = 0;
	/** amounts to the amount of time spent paused */
	#offset = 0;
	/** Speed of the timer, 1 corresponds to actual time */
	#speed = 1;
	/** Whether the user explicitly paused the timer */
	#userPaused = true;
	/** Whether the timer is currently paused */
	#paused = true;

	constructor() {
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "visible") {
				if (!this.#userPaused) this.start();
			} else if (!this.isPaused) {
				this.pause();
				this.#userPaused = false;
			}
		});
	}

	get isPaused() {
		return this.#paused;
	}

	get speed() {
		return this.#speed;
	}

	set speed(s) {
		const t = this.time;
		this.#speed = s;
		this.time = t;
	}

	get time() {
		if (this.isPaused) {
			return (this.#speed * this.#timePaused - this.#offset) / 1000;
		} else {
			return (this.#speed * performance.now() - this.#offset) / 1000;
		}
	}

	set time(t) {
		// Adjust offset such that it is now `newTime`
		const time = this.time;
		this.#offset += (time - t) * 1000;
	}

	start() {
		if (!this.isPaused) return;
		this.#offset += (performance.now() - this.#timePaused) * this.#speed;
		this.#timePaused = -1;
		this.#paused = false;
	}

	pause() {
		if (this.isPaused) return;
		this.#timePaused = performance.now();
		this.#paused = true;
		this.#userPaused = true;
	}

	reset() {
		this.time = 0;
	}
}

export const MouseButton = {
	NONE: -1,
	LEFT: 0,
	MIDDLE: 1,
	RIGHT: 2,
};

/** Tracks mouse position relative to a DOM element */
export class Mouse {
	pressed = MouseButton.NONE;
	x = 0;
	y = 0;

	/**
	 * @param {HTMLElement} elt The DOM element to track the mouse relative to
	 * @param {function(MouseButton):void} [onclick] A callback function
	 */
	constructor(elt, onclick) {
		const mousemove = ({ pageX, pageY }) => {
			let offsetTop = elt.offsetTop;
			let offsetLeft = elt.offsetLeft;
			let parent = elt.offsetParent;
			while (parent) {
				offsetTop += parent.offsetTop;
				offsetLeft += parent.offsetLeft;
				parent = parent.offsetParent;
			}
			this.x = (pageX - offsetLeft) * window.devicePixelRatio;
			this.y = (pageY - offsetTop) * window.devicePixelRatio;
		};

		const mousepress = (button) => {
			if (Object.values(MouseButton).includes(button)) {
				this.pressed = button;
				if (this.onclick) onclick(button);
			} else {
				// Ignore buttons that we don't care abouut
				this.pressed = MouseButton.NONE;
			}
		};

		// Listeners for touchscreen
		elt.addEventListener("touchstart", (e) => {
			mousemove(e.changedTouches[0]);
			mousepress(MouseButton.LEFT);
			e.preventDefault();
		});
		window.addEventListener("touchend", () => mousepress(MouseButton.NONE));
		window.addEventListener("touchmove", (e) =>
			mousemove(e.changedTouches[0]),
		);

		// Listeners for mouse
		elt.addEventListener("mousedown", (e) => {
			mousepress(e.button);
			e.preventDefault();
		});
		window.addEventListener("mouseup", () => mousepress(MouseButton.NONE));
		window.addEventListener("mousemove", (e) => mousemove(e));
	}
}

/**
 * Conversions between different length units.
 * m -- simulation units,
 * perc -- percentage of the total length,
 * px -- onscreen pixels.
 */
export class UnitConversions {
	#simLength = 1.0;
	#pixelLength = 100;

	constructor(simLength, pixelLength) {
		this.#simLength = simLength;
		this.#pixelLength = pixelLength;
	}

	mToPx(metres) {
		return (this.#pixelLength * metres) / this.#simLength;
	}

	pxToM(px) {
		return (px / this.#pixelLength) * this.#simLength;
	}

	percToPx(perc) {
		return (this.#pixelLength * perc) / 100;
	}

	pxToPerc(px) {
		return (px / this.#pixelLength) * 100;
	}

	percToM(perc) {
		return this.pxToM(this.percToPx(perc));
	}

	mToPerc(m) {
		return this.pxToPerc(this.mToPx(m));
	}
}

/** I wrap a canvas element with automatic resizing and colours */
class Simulation {
	/** The canvas DOM element in the browser */
	canvas;
	/** The rendering context for this simulation */
	ctx;
	/** Current frame number */
	frame = 0;
	/** Time between current frame and previous */
	delta = 0;

	/** The colours from the webpage's CSS */
	colours = {
		background: "#fff",
		foreground: "#000",
		accent: "#ff0000",
	};

	render() {
		throw Error("Not implemented");
	}

	async createContext() {
		throw Error("Not implemented");
	}

	constructor() {
		// Get colours defined on root element in css, and redo this when needed
		const recolour = () => {
			const style = window.getComputedStyle(document.documentElement);
			this.colours = {
				background: style.getPropertyValue("--color-content-bg"),
				foreground: style.getPropertyValue("--color-text"),
				accent: style.getPropertyValue("--color3"),
			};
		};
		recolour();
		window.addEventListener("recolour", () => recolour());

		// Track time between frames
		this.frame = 0;
		this.delta = 0;
	}

	/**
	 * Attach to the given canvas element and begin the time loop
	 * @param {HTMLCanvasElement} canvas
	 */
	async attach(canvas) {
		this.canvas = canvas;
		const ctx = await this.createContext();
		if (!ctx) throw Error("Could not create canvas rendering context");
		this.ctx = ctx;

		// Automatically resize the canvas with the window
		this.resize();
		window.addEventListener("resize", () => this.resize());
	}

	start() {
		let prevTime = document.timeline.currentTime;
		const render = (millis) => {
			// We want all the units in seconds, to make other units more realistic
			const time = millis / 1000;
			this.delta = time - prevTime;
			prevTime = time;

			/*
			 * Calculations are not done if the framerate is less than
			 * 10 per second. This is to counter the issue of the
			 * mass 'jumping' if the script goes idle for any substantial
			 * amount of time (e.g. if the user switches to another tab
			 * and back).
			 * If the rendering is running less than 10 times per
			 * second, nothing will animate. But things would get weird
			 * at very low framerates anyway.
			 */
			if (this.render && 1 / this.delta >= 10) {
				this.render(this.ctx);
				this.frame++;
			}
			window.requestAnimationFrame(render);
		};

		// Start animation loop
		window.requestAnimationFrame(render);
	}

	/** Resize the canvas to fill its parent element's width */
	resize() {
		const scaling = window.devicePixelRatio || 1;
		const parent = this.canvas.parentElement;
		const size =
			(parent ? parent.clientWidth : window.innerWidth) * scaling;

		this.canvas.width = size;
		this.canvas.height = size;

		// Set the correct CSS styling
		this.canvas.style.width = `${size / scaling}px`;
		this.canvas.style.height = `${size / scaling}px`;
	}
}

/** I wrap a canvas element with the `2d` context */
export class Simulation2D extends Simulation {
	/** @type {CanvasRenderingContext2D} */
	ctx;

	/**
	 * @returns {Promise<CanvasRenderingContext2D>}
	 */
	async createContext() {
		const ctx = this.canvas.getContext("2d");
		if (!ctx) throw Error("Failed to create 2d context");
		return ctx;
	}

	resize() {
		super.resize();
		// When the window is resized, stroke and fill styles are lost
		this.ctx.strokeStyle = this.colours.accent;
		this.ctx.fillStyle = this.colours.foreground;
		this.ctx.lineJoin = "round";
		this.ctx.font = "bold 0.8em sans-serif";
	}

	/**
	 * Execute the callback, restoring the canvas state back afterwards.
	 * @param {function():void} func
	 */
	withCanvasState(func) {
		this.ctx.save();
		func();
		this.ctx.restore();
	}
}

/** I wrap a canvas element with the `webgl2` context */
export class SimulationGL extends Simulation {
	/** URL of the vertex shader @type {string} */
	vertFile;
	/** URL of the fragment shader @type {string} */
	fragFile;
	/** @type {WebGL2RenderingContext} */
	ctx;
	/** @type WebGLProgram */
	program;

	#uniforms = new Map();
	#attributes = new Map();

	/**
	 * Create the shader program from the provided shader files.
	 * @param {String} vertFile Path to the vertex shader
	 * @param {String} fragFile Path to the fragment shader
	 */
	constructor(vertFile, fragFile) {
		super();
		this.vertFile = vertFile;
		this.fragFile = fragFile;
	}

	/**
	 * @returns {Promise<WebGL2RenderingContext>}
	 */
	async createContext() {
		const ctx = this.canvas.getContext("webgl2");
		if (!ctx) throw Error("Failed to create webgl2 context");
		this.program = await this.#createShaderProgram(ctx);
		return ctx;
	}

	resize() {
		super.resize();
		// Set the WebGL viewport size when resizing
		this.ctx.viewport(0, 0, this.canvas.width, this.canvas.height);
	}

	/**
	 * @param {string} name
	 * @param {function} setter should be one of gl.uniform3fv, gl.uniform1i, etc.
	 * @returns {SimulationGL} this
	 */
	addUniform(name, setter) {
		const loc = this.ctx.getUniformLocation(this.program, name);
		if (loc === null) {
			throw Error(`Failed to find uniform ${name}`);
		}
		this.#uniforms.set(name, {
			location: loc,
			setter: setter.bind(this.ctx),
		});
	}

	/**
	 * @param {string} name
	 * @param {any} value should match the value required by the setter given to `addUniform`
	 * @returns {SimulationGL} this
	 */
	setUniform(name, value) {
		if (!this.#uniforms.has(name)) {
			console.error("Attempted to set non-existent uniform", name);
			return this;
		}
		const uni = this.#uniforms.get(name);
		this.ctx.useProgram(this.program);
		uni.setter(uni.location, value);
	}

	/**
	 * @param {string} name
	 * @param {number} usage e.g. gl.DYNAMIC_DRAW.
	 * @param {number} size
	 * @param {number} type e.g. gl.FLOAT.
	 * @param {number} stride
	 * @returns {SimulationGL} this
	 */
	addAttribute(name, usage, size, type, stride, divisor = 0, offset = 0) {
		const loc = this.ctx.getAttribLocation(this.program, name);
		if (loc === -1) {
			throw Error(`Failed to find attribute ${name}`);
		}
		const buffer = this.ctx.createBuffer();
		this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, buffer);
		this.ctx.enableVertexAttribArray(loc);
		this.ctx.vertexAttribPointer(loc, size, type, false, stride, offset);
		this.ctx.vertexAttribDivisor(loc, divisor);
		this.#attributes.set(name, { loc, buffer, usage });
	}

	/**
	 * @param {string} name
	 * @param {Float32Array} data
	 * @returns {SimulationGL} this
	 */
	setAttribute(name, data) {
		if (!this.#attributes.has(name)) {
			console.error("Attempted to set non-existent attribute", name);
			return;
		}
		const attrib = this.#attributes.get(name);
		this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, attrib.buffer);
		this.ctx.bufferData(this.ctx.ARRAY_BUFFER, data, attrib.usage);
	}

	/**
	 * Create the shader program from the provided shader files.
	 * @param {WebGL2RenderingContext} gl
	 * @return {Promise<WebGLProgram>} The compiled shader program
	 */
	#createShaderProgram(gl) {
		// Creates a shader program from vertex and fragment shader files
		return new Promise((resolve, reject) => {
			const fetchFile = (path) =>
				new Promise((resolve, reject) => {
					const request = new XMLHttpRequest();
					request.addEventListener("load", () => {
						if (request.status != 200)
							return reject(
								`Failed to fetch "${path}", response status ${request.status}`,
							);
						resolve(request.responseText);
					});
					request.addEventListener("error", reject);
					request.addEventListener("abort", reject);
					request.open("GET", path);
					request.send();
				});

			const compileShader = (gl, src, type) => {
				const shader = gl.createShader(type);
				if (!shader) throw Error("Failed to create shader");
				gl.shaderSource(shader, src);
				gl.compileShader(shader);
				if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
					const shaderType =
						type === gl.VERTEX_SHADER ? "vertex" : "fragment";
					console.error(
						`Could not compile ${shaderType} shader: ${gl.getShaderInfoLog(shader)}`,
					);
					return null;
				}
				return shader;
			};

			fetchFile(this.vertFile)
				.then((vertSrc) => {
					fetchFile(this.fragFile)
						.then((fragSrc) => {
							// We have both the shaders as source code, compile them
							const vertShader = compileShader(
								gl,
								vertSrc,
								gl.VERTEX_SHADER,
							);
							const fragShader = compileShader(
								gl,
								fragSrc,
								gl.FRAGMENT_SHADER,
							);
							if (!vertShader || !fragShader)
								return reject(
									"Failed to compile shaders, aborting",
								);

							// Shaders compiled correctly, create and link program
							const program = gl.createProgram();
							if (!program)
								throw Error("Failed to create shader program");
							gl.attachShader(program, vertShader);
							gl.attachShader(program, fragShader);
							gl.linkProgram(program);
							if (
								!gl.getProgramParameter(program, gl.LINK_STATUS)
							) {
								return reject(
									`Failed to link shader program: ${gl.getProgramInfoLog(program)}`,
								);
							}

							resolve(program);
						})
						.catch(reject);
				})
				.catch(reject);
		});
	}
}

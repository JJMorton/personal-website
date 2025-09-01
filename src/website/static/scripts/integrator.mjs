import { Vector } from "./vector.mjs";

/**
 * Something that can be cast into a Vector
 * @typedef {Vector | number[] | number} VectorLike
 */

/**
 * @typedef {function({pos: Vector, vel: Vector, time: number}): Vector} AccelFunc
 */

class Integrator {
	/** Function to calculate the current acceleration @type {AccelFunc} */
	funcAccel;
	/** Current position @type {Vector} */
	pos;
	/** Current velocity @type {Vector} */
	vel;
	/** Integration timestep @type {number} */
	h;

	/** Number of dimensions of the integrated variables @type {number} */
	numDims;

	/**
	 * @param {AccelFunc} funcAccel The equation to integrate
	 * @param {VectorLike} x Initial position
	 * @param {VectorLike} v Initial velocity
	 * @param {number} h Timestep
	 */
	constructor(funcAccel, x, v, h) {
		x = new Vector(x);
		v = new Vector(v);

		if (v.length !== x.length)
			throw Error(
				"Velocity vector must be the same length as the position vector",
			);
		if (h <= 0) throw Error("The timestep, h, must be > 0");

		// Make sure the acceleration function returns a valid vector
		const testAccel = funcAccel({ pos: x, vel: v, time: 0 });
		if (!(testAccel instanceof Vector))
			throw Error("Acceleration function must return a vector");
		if (testAccel.length != x.length)
			throw Error(
				"Acceleration function must return vector of the same length as the position",
			);

		this.pos = x;
		this.vel = v;
		this.funcAccel = funcAccel;
		this.h = h;
		this.numDims = x.length;
	}

	/**
	 * Integrate from tStart until tEnd with a fixed timestep
	 * @param {number} tStart
	 * @param {number} tEnd
	 */
	integrateFixed(tStart, tEnd) {
		let t = tStart;
		while (t < tEnd) {
			// Make sure we end exactly at tEnd
			const timestep = Math.min(this.h, tEnd - t);
			this.integrator(t, timestep);
			t += timestep;
		}
	}

	/**
	 * Integrates from `t` to `t + h`.
	 * @param {number} t
	 */
	integrator(t) {
		throw Error("Not implemented");
	}
}

/**
 * Basic Euler integration
 */
export class EulerIntegrator extends Integrator {
	/**
	 * @param {number} t
	 */
	integrator(t) {
		// v = v + ha
		this.vel = this.funcAccel({ pos: this.pos, vel: this.vel, time: t })
			.mult(this.h)
			.add(this.vel);
		// x = x + hv
		this.pos = this.vel.mult(this.h).add(this.pos);
	}
}

/*
 * Fourth order Runge-Kutta integration
 */

export class RK4Integrator extends Integrator {
	/**
	 * @param {number} t
	 */
	integrator(t) {
		// q is the system as a whole in phase space, e.g. [x0, x1, v0, v1]
		let q = this.pos.concat(this.vel);

		/**
		 * The equation of motion for q
		 * @param {number} t
		 * @param {Vector} q
		 * @returns {Vector}
		 */
		const eom = (t, q) => {
			// Split q into position and velocity, so we can call funcAccel
			const x = q.slice(0, this.numDims);
			const v = q.slice(this.numDims);
			return v.concat(this.funcAccel({ time: t, pos: x, vel: v }));
		};

		// Calculate the slopes
		const k1 = eom(t, q).mult(this.h);
		const k2 = eom(t + this.h / 2, q.add(k1.mult(0.5))).mult(this.h);
		const k3 = eom(t + this.h / 2, q.add(k2.mult(0.5))).mult(this.h);
		const k4 = eom(t + this.h, q.add(k3)).mult(this.h);

		// Weight them
		q = q
			.add(k1.divide(6))
			.add(k2.divide(3))
			.add(k3.divide(3))
			.add(k4.divide(6));

		// Split back into position and velocity
		this.pos = q.slice(0, this.numDims);
		this.vel = q.slice(this.numDims);
	}
}

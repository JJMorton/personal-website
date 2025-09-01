import { EulerIntegrator, RK4Integrator } from "../integrator.mjs";
import { Mouse, Simulation2D, Timer, UnitConversions } from "../simulation.mjs";
import { Vector } from "../vector.mjs";

export class DoublePendulum extends Simulation2D {
	/** @type {{time: number, pos: Vector}[]} */
	trail = [];

	/** If the user is dragging the pendulum with their mouse @type {boolean} */
	dragging = false;

	timer = new Timer();

	/** @type Mouse */
	mouse;

	/** @type {EulerIntegrator | RK4Integrator} */
	integrator;

	constructor({
		g = 9.8,
		m1 = 1.0,
		m2 = 0.5,
		l1 = 1.0,
		l2 = 0.5,
		trailduration = 5.0,
		showtrail = true,
		showpendulum = true,
		integrator = RK4Integrator,
		timestep = 0.01,
	} = {}) {
		super();
		this.g = g;
		this.m1 = m1;
		this.m2 = m2;
		this.l1 = l1;
		this.l2 = l2;
		this.trailduration = trailduration;
		this.showtrail = showtrail;
		this.showpendulum = showpendulum;

		const acceleration = ({ pos, vel }) => {
			const [theta1, theta2] = pos;
			const [omega1, omega2] = vel;
			const { m1, m2, l1, l2, g } = this;
			const sin = Math.sin;
			const cos = Math.cos;
			const delta = theta2 - theta1;

			// Ouch, no way to make these equations look pretty :(
			return new Vector([
				(m2 * l1 * omega1 * omega1 * sin(delta) * cos(delta) +
					m2 * g * sin(theta2) * cos(delta) +
					m2 * l2 * omega2 * omega2 * sin(delta) -
					(m1 + m2) * g * sin(theta1)) /
					((m1 + m2) * l1 - m2 * l1 * cos(delta) * cos(delta)),
				(-m2 * l2 * omega2 * omega2 * sin(delta) * cos(delta) +
					(m1 + m2) *
						(g * sin(theta1) * cos(delta) -
							l1 * omega1 * omega1 * sin(delta) -
							g * sin(theta2))) /
					((m1 + m2) * l2 - m2 * l2 * cos(delta) * cos(delta)),
			]);
		};

		/** @type {EulerIntegrator | RK4Integrator} */
		this.integrator = new integrator(
			acceleration.bind(this),
			[0.8 * Math.PI, 0.9 * Math.PI],
			[0.0, 0.0],
			timestep,
		);
	}

	resize() {
		super.resize();
		this.trail = [];
	}

	attach(canvas) {
		super.attach(canvas);
		this.mouse = new Mouse(this.canvas);
	}

	start() {
		this.timer.start();
	}

	stop() {
		this.timer.pause();
	}

	reset() {
		this.trail = [];
		this.integrator.vel.x = 0;
		this.integrator.vel.y = 0;
	}

	get conversions() {
		return new UnitConversions(
			2.2 * (this.l1 + this.l2),
			this.canvas.width,
		);
	}

	get energyKinetic() {
		const { m1, m2, l1, l2 } = this;
		const [theta1, theta2] = this.integrator.pos;
		const [omega1, omega2] = this.integrator.vel;
		const I1 = m1 * l1 ** 2;
		const I2 =
			m2 *
			l2 ** 2 *
			(1.0 +
				(l1 / l2) ** 2 +
				2.0 *
					(l1 / l2) *
					(omega1 / omega2) *
					Math.cos(theta2 - theta1));
		return 0.5 * (I1 * omega1 * omega1 + I2 * omega2 * omega2);
	}

	get energyPotential() {
		const { m1, m2, l1, l2, g } = this;
		const [theta1, theta2] = this.integrator.pos;
		const V =
			-(m1 + m2) * g * l1 * Math.cos(theta1) -
			m2 * g * l2 * Math.cos(theta2) +
			(m1 + m2) * g * l1 +
			m2 * g * l2;
		return V;
	}

	get energyTotal() {
		return this.energyKinetic + this.energyPotential;
	}

	get r1() {
		return 0.05 * Math.cbrt(this.m1);
	}

	get r2() {
		return 0.05 * Math.cbrt(this.m2);
	}

	render() {
		const drawline = (x1, y1, x2, y2) => {
			this.ctx.beginPath();
			this.ctx.moveTo(x1, y1);
			this.ctx.lineTo(x2, y2);
			this.ctx.stroke();
		};

		const drawcircle = (x, y, r) => {
			this.ctx.beginPath();
			this.ctx.arc(x, y, r, 0, 2 * Math.PI);
			this.ctx.fill();
		};

		const time = this.timer.time;
		const pivot = new Vector([
			this.canvas.width / 2,
			this.canvas.height / 2,
		]).map((q) => this.conversions.pxToM(q));

		// The actual integration of the eom
		if (!this.timer.isPaused)
			this.integrator.integrateFixed(time, time + this.delta);

		// Positions of the masses
		const [theta1, theta2] = this.integrator.pos;
		const pos1 = new Vector([Math.sin(theta1), Math.cos(theta1)])
			.mult(this.l1)
			.add(pivot);
		const pos2 = new Vector([Math.sin(theta2), Math.cos(theta2)])
			.mult(this.l2)
			.add(pos1);

		// User can drag around the masses
		if (this.mouse.pressed === 0) {
			const mouse = new Vector([this.mouse.x, this.mouse.y]).map((q) =>
				this.conversions.pxToM(q),
			);
			const theta = Math.PI / 2 - mouse.sub(pivot).getHeading();
			this.integrator.pos[0] = theta;
			this.stop();
			this.reset();
			this.dragging = true;
		} else if (this.dragging) {
			this.start();
			this.dragging = false;
		}

		// Add to the trail
		if (!this.timer.isPaused) {
			this.trail.push({ time, pos: pos2 });
			while (this.trail[0].time < time - this.trailduration) {
				this.trail.shift();
			}
		}

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Draw the trail
		if (this.showtrail && this.trail.length > 0) {
			this.ctx.lineWidth = 3;
			this.ctx.strokeStyle = this.colours.accent;
			for (let i = 1; i < this.trail.length; i++) {
				this.ctx.globalAlpha =
					1 -
					Math.pow(
						(time - this.trail[i].time) / this.trailduration,
						4,
					);
				const start = this.trail[i - 1].pos.map((q) =>
					this.conversions.mToPx(q),
				);
				const end = this.trail[i].pos.map((q) =>
					this.conversions.mToPx(q),
				);
				drawline(start.x, start.y, end.x, end.y);
			}
			this.ctx.globalAlpha = 1;
		}

		// Draw the pendulum
		if (this.showpendulum) {
			this.ctx.lineWidth = 3;
			this.ctx.strokeStyle = this.colours.foreground;
			const pivot_px = pivot.map((q) => this.conversions.mToPx(q));
			const pos1_px = pos1.map((q) => this.conversions.mToPx(q));
			const pos2_px = pos2.map((q) => this.conversions.mToPx(q));
			drawline(pivot_px.x, pivot_px.y, pos1_px.x, pos1_px.y);
			drawline(pos1_px.x, pos1_px.y, pos2_px.x, pos2_px.y);
			drawcircle(pivot_px.x, pivot_px.y, this.conversions.mToPx(0.02));
			drawcircle(pos1_px.x, pos1_px.y, this.conversions.mToPx(this.r1));
			drawcircle(pos2_px.x, pos2_px.y, this.conversions.mToPx(this.r2));
		}
	}
}

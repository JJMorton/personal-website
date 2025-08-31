window.addEventListener("load", function () {
	"use strict";

	const canvas = document.querySelector("canvas");
	const ctx = canvas.getContext("2d");
	canvas.style.backgroundColor = "var(--color1)";

	const render = () => {
		const L = canvas.height;
		const tau = 2.0 * Math.PI;

		// Light colour
		ctx.globalCompositeOperation = "source-over";
		{
			const nLines = 50;
			const res = 200;
			ctx.globalAlpha = 0.1;
			ctx.lineWidth = 6;
			ctx.strokeStyle = window
				.getComputedStyle(document.body)
				.getPropertyValue("--color4");
			for (let y0 = -0.1; y0 <= 1.1; y0 += 1.0 / nLines) {
				ctx.moveTo(0, y0 * L);
				ctx.beginPath();
				for (let t = -0.1; t <= 1.1; t += 1.0 / res) {
					const x =
						(t +
							0.01 * Math.cos(tau * t * 4) +
							0.02 * Math.sin(tau * y0 * 5)) *
						L;
					const y =
						(y0 + 0.04 * Math.cos(tau * (t + y0) * 2 - tau * y0)) *
						L;
					ctx.lineTo(x, y);
				}
				ctx.stroke();
			}
		}

		// Small highlights
		ctx.globalCompositeOperation = "source-over";
		{
			const nLines = 50;
			const res = 200;
			ctx.globalAlpha = 0.05;
			ctx.lineWidth = 1;
			ctx.strokeStyle = window
				.getComputedStyle(document.body)
				.getPropertyValue("--color5");
			for (let y0 = -0.1; y0 <= 1.1; y0 += 1.0 / nLines) {
				ctx.moveTo(0, y0 * L);
				ctx.beginPath();
				for (let t = -0.1; t <= 1.1; t += 1.0 / res) {
					const x =
						(t +
							0.01 * Math.cos(tau * t * 4) +
							0.02 * Math.sin(tau * y0 * 5)) *
						L;
					const y =
						(y0 + 0.04 * Math.cos(tau * (t + y0) * 2 - tau * y0)) *
						L;
					ctx.lineTo(x, y);
				}
				ctx.stroke();
			}
		}

		// Darken with overlaid background colour
		ctx.globalCompositeOperation = "xor";
		{
			const nLines = 50;
			const res = 200;
			ctx.globalAlpha = 0.7;
			ctx.lineWidth = 6;
			ctx.strokeStyle = window
				.getComputedStyle(document.body)
				.getPropertyValue("--color1");
			for (let y0 = -0.1; y0 <= 1.1; y0 += 1.0 / nLines) {
				ctx.moveTo(0, y0 * L);
				ctx.beginPath();
				for (let t = -0.1; t <= 1.1; t += 1.0 / res) {
					const x =
						(t +
							0.015 * Math.cos(tau * t * 4) +
							0.015 * Math.sin(tau * y0 * 5)) *
						L;
					const y =
						(y0 + 0.045 * Math.cos(tau * (t + y0) * 2 - tau * y0)) *
						L;
					ctx.lineTo(x, y);
				}
				ctx.stroke();
			}
		}
	};

	const resize = () => {
		canvas.width = 600;
		canvas.height = 600;
		render();
	};
	resize();
	window.addEventListener("resize", resize);
});

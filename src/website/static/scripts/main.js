window.addEventListener("load", function() {

	"use strict";

	// Make canvas elements fill their parent
	document.querySelectorAll("canvas").forEach(canvas => {
		const parent = canvas.parentElement
		const resize = function() {
			canvas.width = parent.clientWidth;
			canvas.height = parent.clientHeight;
		};
		resize();
		window.addEventListener("resize", resize);
	});

});

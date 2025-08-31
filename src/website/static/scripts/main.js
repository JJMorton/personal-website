window.addEventListener("load", function () {
	"use strict";

	// Basic email scraping prevention
	for (const elt of document.getElementsByClassName("email")) {
		const addr = elt.textContent
			.replace("(at)", "@")
			.replaceAll("(dot)", ".");
		elt.textContent = addr;
		elt.href = `mailto:${addr}`;
	}
});

import { computed } from "https://unpkg.com/vue@3/dist/vue.esm-browser.js";

let i = 0;

export default {
	name: "Gauge",
	props: {
		name: String,
		value: Number,
		min: Number,
		max: Number,
		decimals: Number,
		units: String,
	},
	template: `
		<div class="gauge">
			<label :for="id">
				<span class="name">{{ name }}</span>
				<output :for="id">{{ rounded }}</output>
				<span class="units">{{ units }}</span>
			</label>
			<meter :id :value :min :max></meter>
		</div>
	`,
	setup(props) {
		const id = `gauge${i++}`;
		const rounded = computed(() =>
			props.value.toFixed(
				props.decimals === undefined ? 3 : props.decimals,
			),
		);
		return { id, rounded };
	},
};

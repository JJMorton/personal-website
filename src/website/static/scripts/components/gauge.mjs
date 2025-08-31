let i = 0;

export default {
	name: 'Gauge',
	props: {
		name: String,
		value: Number,
		min: Number,
		max: Number,
		units: String,
		disabled: Boolean,
	},
	template: `
		<div class="gauge">
			<label :for="id">
				<span class="name">{{ name }}</span>
				<output :for="id">{{ value }}</output>
				<span class="units">{{ units }}</span>
			</label>
			<meter :disabled :id :value :min :max></meter>
		</div>
	`,
	setup(props) {
		const id = `gauge${i++}`;
		return { id };
	},
}

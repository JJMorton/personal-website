let i = 0;

export default {
	name: 'Gauge',
	template: '#component-gauge',
	props: {
		name: String,
		value: Number,
		min: Number,
		max: Number,
		units: String,
		disabled: Boolean,
	},
	setup(props) {
		const id = `gauge${i++}`;
		return { id };
	},
}

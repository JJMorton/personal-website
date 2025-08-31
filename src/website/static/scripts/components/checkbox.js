import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

let i = 0;

export default {
	name: 'Checkbox',
	template: '#component-checkbox',
	props: {
		name: String,
		default: Boolean,
		disabled: Boolean,
	},
	setup(props) {
		const id = `checkbox${i++}`;
		const checked = ref(props.default);

		function toggle() {
			checked.value = !checked.value;
		}

		function reset() {
			checked.value = props.default;
		}

		return { id, checked, toggle, reset };
	},
}

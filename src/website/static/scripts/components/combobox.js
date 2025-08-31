import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

let i = 0;

export default {
	name: 'Combobox',
	template: '#component-combobox',
	props: {
		label: String,
		default: String,
		options: Array,
		disabled: Boolean,
	},
	setup(props) {
		const id = `combobox${i++}`;
		const selected = ref(props.default || "");

		function reset() {
			selected.value = props.default;
		}

		return { id, selected, reset };
	},
}

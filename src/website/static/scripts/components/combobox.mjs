import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

let i = 0;

export default {
	name: 'Combobox',
	props: {
		label: String,
		default: String,
		options: Array,
		disabled: Boolean,
	},
	template: `
		<div class="combobox" title="Choose an option">
			<label :for="id">{{ label }}</label>
			<select :id v-model="selected" :disabled>
				<option v-for="opt in options" :key="opt.value" :value="opt.value">
					{{ opt.label }}
				</option>
			</select>
		</div>
	`,
	setup(props) {
		const id = `combobox${i++}`;
		const selected = ref(props.default || "");

		function reset() {
			selected.value = props.default;
		}

		return { id, selected, reset };
	},
}

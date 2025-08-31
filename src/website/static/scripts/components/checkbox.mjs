import { ref } from "https://unpkg.com/vue@3/dist/vue.esm-browser.js";

let i = 0;

export default {
	name: "Checkbox",
	props: {
		name: String,
		default: Boolean,
		disabled: Boolean,
	},
	template: `
		<div class="checkbox" title="Toggle me on or off">
			<input type="checkbox" v-model="checked" :disabled :id></input>
			<label :for="id">{{ name }}</label>
		</div>
	`,
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
};

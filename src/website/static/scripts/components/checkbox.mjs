import { computed } from "https://unpkg.com/vue@3/dist/vue.esm-browser.js";

let i = 0;

export default {
	name: "Checkbox",
	props: {
		name: String,
		checked: Boolean,
		disabled: Boolean,
	},
	emits: ["update:checked"],
	template: `
		<div class="checkbox" title="Toggle me on or off">
			<input type="checkbox" v-model="checked" :true-value="true" :false-value="false" :disabled :id></input>
			<label :for="id">{{ name }}</label>
		</div>
	`,
	setup(props, { emit }) {
		const id = `checkbox${i++}`;
		const checked = computed({
			get() {
				return props.checked;
			},
			set(v) {
				emit("update:checked", v);
			},
		});

		return { id, checked };
	},
};

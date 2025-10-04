import { computed } from "https://unpkg.com/vue@3/dist/vue.esm-browser.js";

let i = 0;

export default {
	name: "Combobox",
	props: {
		label: String,
		selected: Number,
		options: Array,
		disabled: Boolean,
	},
	emits: ["update:selected"],
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
	setup(props, { emit }) {
		const id = `combobox${i++}`;

		const selected = computed({
			get() {
				return props.selected;
			},
			set(v) {
				emit("update:selected", v);
			},
		});

		return { id, selected };
	},
};

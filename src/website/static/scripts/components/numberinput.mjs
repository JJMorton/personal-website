import { computed, ref } from "https://unpkg.com/vue@3/dist/vue.esm-browser.js";

let i = 0;

export default {
	name: "Numberinput",
	props: {
		value: Number,
		disabled: Boolean,
	},
	emits: ["update:value"],
	template: `
		<span
			:id
			role="textbox"
			contenteditable
			title="Enter a number"
			style="border: 1px solid rgba(0, 0, 0, 0.2); padding: 0 2px;"
			:key
			:onblur
			:onkeypress
		>{{ value }}</span>
	`,
	setup(props, { emit }) {
		const id = `numinput{i++}`;
		const value = computed({
			get() {
				return props.value;
			},
			set(v) {
				emit("update:value", v);
			},
		});

		const key = ref(0);

		return {
			id,
			value,
			key,
			onblur: (e) => {
				const v = parseFloat(e.target.textContent);
				if (!isNaN(v)) value.value = v;
				key.value++;
			},
			onkeypress: (e) => {
				if (e.keyCode == 13) e.target.blur();
				return /[0-9|\.|\-]/i.test(e.key);
			},
		};
	},
};

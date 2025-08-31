import { ref, computed } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

let i = 0;

export default {
	name: 'Knob',
	props: {
		name: String,
		value: Number,
		units: String,
		min: Number,
		max: Number,
		step: Number,
		disabled: Boolean,
	},
	emits: ['update:value'],
	template: `
		<div class="knob" :style>
			<div
				:id
				:class="{ wheel: true, changing, disabled }"
				title="Drag me up and down, double click to reset"
				@mousedown="grab"
				@touchstart="grab"
				@dblclick="reset"
			>
				<div class="marker"></div>
			</div>
			<label class="value" :for="id">
				<p class="name">{{ name }}</p>
				<p>
					<output :for="id">{{ value }}</output>
					<span class="units">{{ units }}</span>
				</p>
			</label>
		</div>
	`,
	setup(props, { emit }) {
		const value = computed({
			get() { return props.value },
			set(v) { emit('update:value', v) }
		});

		const id = `knob${i++}`;
		const changing = ref(false);
		const style = computed(() => {
			const range = props.max - props.min;
			const angle = (value.value - props.min) / range * 2.0 * Math.PI;
			return `--angle: ${angle}rad;`;
		});

		const defaultValue = value.value;
		function reset() {
			if (props.disabled) return;
			value.value = defaultValue;
		}

		function grab(e) {
			e.preventDefault();
			if (props.disabled) return;

			// Record the initial value and position of the mouse/touch
			let startValue = value.value;
			let startY = 0;
			switch (e.type) {
				case "mousedown":
					startY = e.pageY; break;
				case "touchstart":
					startY = e.touches[0].pageY; break;
				default:
					return;
			}

			changing.value = true;

			// Listen for mouse move events when pressed, and compute the new value each time
			const moveListener = e => {
				const pageY = e.type == "mousemove" ? e.pageY : e.touches[0].pageY;
				const newValue = startValue + (props.max - props.min) * (startY - pageY) * 3 / window.screen.height
				const stepped = Math.round(newValue / props.step) * props.step;
				const clamped = Math.min(props.max, Math.max(props.min, stepped));
				// Prevent floating point machine precision issues
				value.value = parseFloat(clamped.toFixed(8));
			};
			window.addEventListener("mousemove", moveListener);
			window.addEventListener("touchmove", moveListener);

			// Stop listening for mouse move events when released
			const upListener = e => {
				if (e.type === "touchend" && e.touches.length !== 0) return;
				window.removeEventListener("mousemove", moveListener);
				window.removeEventListener("touchmove", moveListener);
				window.removeEventListener("mouseup", upListener);
				window.removeEventListener("touchend", upListener);
				changing.value = false;
			};
			window.addEventListener("mouseup", upListener);
			window.addEventListener("touchend", upListener);
		}

		return {
			id,
			changing,
			style,
			grab,
			reset,
		};
	},
}

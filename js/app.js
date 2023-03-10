var theDevice
var port1
var port2

var devices = []

var currentNote = null;


WebMidi.enable()


async function setup() {


	chooseMIDIInput()
	// Create AudioContext
	const WAContext = window.AudioContext || window.webkitAudioContext;
	const context = new WAContext();

	context.onstatechange = function() {
	  if (context.state === "running" && document.getElementById("audioStatus")) {
		  document.getElementById("audioStatus").innerHTML = "🟢";
	  }
	};

	// Create gain node and connect it to audio output
	const outputNode = context.createGain();
	outputNode.connect(context.destination);

	createDevice ("export/patch1.export.json", 0, context, outputNode)
	
    if (document.getElementById(`patcher-title1`)) {
	createDevice ("export/patch4.export.json", 1, context, outputNode)
	}
	document.body.onclick = () => {
		context.resume();
	}

	// Skip if you're not using guardrails.js
	if (typeof guardrails === "function")
		guardrails();
	

}

async function createDevice(patchExportURL, deviceNumber, context, outputNode) {
  let response, patcher;

  try {
    response = await fetch(patchExportURL);
    patcher = await response.json();

    if (!window.RNBO) {
      await loadRNBOScript(patcher.desc.meta.rnboversion);
    }
  } catch (err) {
    const errorContext = { error: err };
    if (response && (response.status >= 300 || response.status < 200)) {
      errorContext.header = `Couldn't load patcher export bundle`;
      errorContext.description = `Check app.js to see what file it's trying to load. Currently it's` +
        ` trying to load "${patchExportURL}". If that doesn't` +
        ` match the name of the file you exported from RNBO, modify` +
        ` patchExportURL in app.js.`;
    }
    if (typeof guardrails === "function") {
      guardrails(errorContext);
    } else {
      throw err;
    }
    return;
  }

  let dependencies = [];
  try {
    const dependenciesResponse = await fetch("export/dependencies.json");
    dependencies = await dependenciesResponse.json();
    dependencies = dependencies.map(d => d.file ? Object.assign({}, d, {
      file: "export/" + d.file
    }) : d);
  } catch (e) {}

  try {
      devices[deviceNumber] = await RNBO.createDevice({
      context,
      patcher
    });
    console.log(patcher);
  } catch (err) {
    if (typeof guardrails === "function") {
      guardrails({
        error: err
      });
    } else {
      throw err;
    }
    return;
  }

  if (dependencies.length) {
      await devices[deviceNumber].loadDataBufferDependencies(dependencies);
  }

  devices[deviceNumber].node.connect(outputNode);
  if (document.getElementById(`patcher-title${deviceNumber}`)) {
  document.getElementById(`patcher-title${deviceNumber}`).innerText = (patcher.desc.meta.filename || "Unnamed Patcher") + " (v" + patcher.desc.meta.rnboversion + ")";
}


	//make sliders
	console.log(`rnbo${deviceNumber}-parameter-sliders`)

if (document.getElementById(`rnbo${deviceNumber}-parameter-sliders`)) {
	makeSliders(devices[deviceNumber], `rnbo${deviceNumber}-parameter-sliders`);
} else {
}


makeMIDIListener(devices[deviceNumber], deviceNumber);


  console.log(`Device ${deviceNumber} created.`);
}




function loadRNBOScript(version) {
	return new Promise((resolve, reject) => {
		if (/^\d+\.\d+\.\d+-dev$/.test(version)) {
			throw new Error("Patcher exported with a Debug Version!\nPlease specify the correct RNBO version to use in the code.");
		}
		const el = document.createElement("script");
		el.src = "https://c74-public.nyc3.digitaloceanspaces.com/rnbo/" + encodeURIComponent(version) + "/rnbo.min.js";
		el.onload = resolve;
		el.onerror = function(err) {
			console.log(err);
			reject(new Error("Failed to load rnbo.js v" + version));
		};
		document.body.append(el);
	});
}





function makeSliders(thisDevice, ID) {
	let pdiv = document.getElementById(ID);

	// This will allow us to ignore parameter update events while dragging the slider.
	let isDraggingSlider = false;
	let uiElements = {};

	thisDevice.parameters.forEach(param => {
		// Subpatchers also have params. If we want to expose top-level
		// params only, the best way to determine if a parameter is top level
		// or not is to exclude parameters with a '/' in them.
		// You can uncomment the following line if you don't want to include subpatcher params

		//if (param.id.includes("/")) return;

		// Create a label, an input slider and a value display
		let label = document.createElement("label");
		let slider = document.createElement("input");
		let text = document.createElement("input");
		let sliderContainer = document.createElement("div");
		let br = document.createElement("br");

		sliderContainer.appendChild(label);
		//   sliderContainer.appendChild(br);
		sliderContainer.appendChild(slider);
		sliderContainer.appendChild(text);

		// Add a name for the label
		label.setAttribute("name", param.name);
		label.setAttribute("for", param.name);
		label.setAttribute("class", "param-label");
		label.textContent = `${param.name}: `;

		// Make each slider reflect its parameter
		slider.setAttribute("type", "range");
		slider.setAttribute("class", "param-slider");
		slider.setAttribute("id", param.id);
		slider.setAttribute("name", param.name);
		slider.setAttribute("min", param.min);
		slider.setAttribute("max", param.max);
		if (param.steps > 1) {
			slider.setAttribute("step", (param.max - param.min) / (param.steps - 1));
		} else {
			slider.setAttribute("step", (param.max - param.min) / 1000.0);
		}
		slider.setAttribute("value", param.value);

		// Make a settable text input display for the value
		text.setAttribute("value", param.value.toFixed(1));
		text.setAttribute("type", "text");

		// Make each slider control its parameter
		slider.addEventListener("pointerdown", () => {
			isDraggingSlider = true;
		});
		slider.addEventListener("pointerup", () => {
			isDraggingSlider = false;
			slider.value = param.value;
			text.value = param.value.toFixed(1);
		});
		slider.addEventListener("input", () => {
			let value = Number.parseFloat(slider.value);
			param.value = value;
		});

		// Make the text box input control the parameter value as well
		text.addEventListener("keydown", (ev) => {
			if (ev.key === "Enter") {
				let newValue = Number.parseFloat(text.value);
				if (isNaN(newValue)) {
					text.value = param.value;
				} else {
					newValue = Math.min(newValue, param.max);
					newValue = Math.max(newValue, param.min);
					text.value = newValue;
					param.value = newValue;
				}
			}
		});

		// Store the slider and text by name so we can access them later
		uiElements[param.name] = {
			slider,
			text
		};

		// Add the slider element
		pdiv.appendChild(sliderContainer);
	});


	// Listen to parameter changes from the device
	thisDevice.parameterChangeEvent.subscribe(param => {
		if (!isDraggingSlider)
			console.log("Dragging")
			uiElements[param.name].slider.value = param.value;
		uiElements[param.name].text.value = param.value.toFixed(1);
	});
}


function loadPresets(device, patcher, ID) {

	console.log("Loading presets for " + device + " + " + patcher + " + " + ID + "...")
	let presets = patcher.presets || [];
	if (presets.length < 1) {
		document.getElementById("rnbo-presets" + ID).removeChild(document.getElementById("preset-select" + ID));
		return;
	}

	let presetSelect = document.getElementById("preset-select" + ID);
	presets.forEach((preset, index) => {
		const option = document.createElement("option");
		option.innerText = preset.name;
		option.value = index;
		presetSelect.appendChild(option);
	});
	presetSelect.onchange = () => device.setPreset(presets[presetSelect.value].preset);
	console.log("Loaded presets for " + device + " + " + patcher + " + " + ID)

}

function changeInputs() {
	var select0 = document.getElementById("input0-select");
	var value0 = select0.selectedIndex


	for (var i = 0; i < WebMidi.inputs.length; i++) {
		const mySynth = WebMidi.inputs[i];
		mySynth.channels[1].removeListener("noteon")

	}
	

	if (document.getElementById("input1-select")) {
	var select1 = document.getElementById("input1-select");
	var value1 = select1.selectedIndex
	makeMIDIListener(devices[1], value1);
}




	console.log("Logger:")
	makeMIDIListener(devices[0], value0);

}





function makeMIDIListener(device, port) {
	console.log("Making notes: " + device + ", " + port)

	if (device.numMIDIInputPorts === 0) return;


	const mySynth = WebMidi.inputs[port];
	console.log("Synth: " + mySynth)


	let midiPort = 0;
	let noteDurationMs = 250;

	let midiChannel = 0;

	let pitchClassMap = [6, null, 5, null, 7, 4, null, 0, null, 3, 1, 1, 2];
	let pitchNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
	let pitchHeader = document.getElementById("pitch");
	let instructions = document.getElementById("instructions");


	mySynth.channels[1].addListener("noteon", e => {
		let pitchClass = e.note.number % 24.

		let noteOnMessage = [
			144 + midiChannel, // Code for a note on: 10010000 & midi channel (0-15)
			e.data[1], // MIDI Note
			e.data[2] // MIDI Velocity

		];

		// Format a MIDI message paylaod, this constructs a MIDI on event

		if (document.getElementById("arrow")) {

		if (pitchClass >= 0 && pitchClass <= 12) {
			let arrowIndex = pitchClassMap[pitchClass];
			if (arrowIndex !== null) {
				arrowArray[arrowIndex].flashOn(e.data[2]);
				arrowArray[arrowIndex].draw();
			}
		}

		switch (pitchClass) {
			case 0:
				if (currentNote === null) {
					instructionsFader("Great job! Now play a D by pressing up and left.", pitchClass);
				}
				break;
			case 2:
				if (currentNote === 0) {
					instructionsFader("Nice work! Now play an E by pressing up and right.", pitchClass);
				}
				break;
			case 4:
				if (currentNote === 2) {
					instructionsFader("Well done! Now play an F by pressing left.", pitchClass);

				}
				break;

			case 5:
				if (currentNote === 4) {
					instructionsFader("Fantastic! Now play a G by pressing right.", pitchClass);

				}
				break;

			case 7:
				if (currentNote === 5) {
					instructionsFader("Brilliant! Now play an A by pressing down and left.", pitchClass);

				}
				break;

			case 9:
				if (currentNote === 7) {
					instructionsFader("Excellent! Now play a B by pressing down and right.", pitchClass);
				}
				break;

			case 11:
				if (currentNote === 9) {
					instructionsFader("Amazing! Now play a C by pressing down.", pitchClass);
				}
				break;

			case 12:
				if (currentNote === 11) {
					instructionsFader("You've played a whole scale! Well done.", pitchClass);
				}
				break;
		}
	}

		// Including rnbo.min.js (or the unminified rnbo.js) will add the RNBO object
		// to the global namespace. This includes the TimeNow constant as well as
		// the MIDIEvent constructor.


		// When scheduling an event to occur in the future, use the current audio context time
		// multiplied by 1000 (converting seconds to milliseconds) for now.
		let noteOnEvent = new RNBO.MIDIEvent(device.context.currentTime * 1000, midiPort, noteOnMessage);

		device.scheduleEvent(noteOnEvent);


	});


	mySynth.channels[1].addListener("noteoff", e => {


		let noteOffMessage = [
			128 + midiChannel, // Code for a note off: 10000000 & midi channel (0-15)
			e.data[1], // MIDI Note
			e.data[2] // MIDI Velocity
		];

		if (document.getElementById("arrow")) {

		let pitchClass = e.note.number % 24
		let pitchClassMap = [6, null, 5, null, 7, 4, null, 0, null, 3, 2, 1, 2];

		if (pitchClass >= 0 && pitchClass <= 12) {
			let arrowIndex = pitchClassMap[pitchClass];
			if (arrowIndex !== null) {
				arrowArray[arrowIndex].flashOff();
				arrowArray[arrowIndex].draw();

			}
		}

		// Including rnbo.min.js (or the unminified rnbo.js) will add the RNBO object
		// to the global namespace. This includes the TimeNow constant as well as
		// the MIDIEvent constructor.
	}

		let noteOffEvent = new RNBO.MIDIEvent(device.context.currentTime * 1000, midiPort, noteOffMessage);
		device.scheduleEvent(noteOffEvent);


	});
}

function instructionsFader(instructionsText, pitchClass) {
	$("#instructions").fadeOut("fast", function() {
		$(this).text(instructionsText)
	}).fadeIn();
	currentNote = pitchClass;

}


function chooseMIDIInput() {
	navigator.requestMIDIAccess().then(function(midiAccess) {
			console.log("Input requested")
			var inputs = midiAccess.inputs;
			console.log(inputs)

			if (document.getElementById("input0-select")) {
				var inputSelect0 = document.getElementById("input0-select");
				inputSelect0.innerHTML = "";

				for (var input of inputs.values()) {
					var option = document.createElement("option");
					option.value = input.id;
					option.text = input.name;
					inputSelect0.add(option);
					//      inputSelect2.add(option); 

				}
			}
			var element = document.getElementById("input1-select")
			if (typeof(element) != 'undefined' && element != null) {

				var inputSelect1 = document.getElementById("input1-select");
				inputSelect1.innerHTML = "";

				// Clear the input select options

				// Add an option for each available MIDI input


				//I don't understand why this won't work in one for loop but it doesn't
				for (var input of inputs.values()) {
					var option = document.createElement("option");
					option.value = input.id;
					option.text = input.name;
					inputSelect1.add(option);
				}

				inputSelect1.selectedIndex = 1
			}



		});
	}



	function controlToggle(element) {
		var sliders = document.getElementById(element);
		if (sliders.style.display === "none") {
			sliders.style.display = "flex";
		} else {
			sliders.style.display = "none";
		}
	}

	var arrowArray = [];

	function arrowFlash() {
		var canvas = document.getElementById("arrow");
		var ctx = canvas.getContext("2d");
		// Create an arrow object
		for (let i = 0; i < 8; i++) {
			arrow = {
x: canvas.width / 2, // center the x-coordinate
            y: canvas.height / 2, // center the y-coordinate
				angle: i * 45,
				color: "black",
				flashOn: function(velocity) {

					this.color = `rgb(${velocity * 2} , ${velocity}, 255)`;
					console.log(velocity)
				},
				flashOff: function() {
					this.color = "#00008B";
					console.log("flashOff")

				},
				draw: function() {
					ctx.save();
					ctx.translate(this.x, this.y);
					ctx.rotate(this.angle * Math.PI / 180);
					ctx.fillStyle = this.color;
					ctx.beginPath();
					ctx.moveTo(10, -5);
					ctx.lineTo(0, 0);
					ctx.lineTo(10, 5);
					ctx.lineTo(50, 5);
					ctx.lineTo(50, 10);
					ctx.lineTo(60, 0);
					ctx.lineTo(50, -10);
					ctx.lineTo(50, -5);

					ctx.fill();
					ctx.restore();
				}
			}
			arrowArray.push(arrow);
		}
		// Draw the arrow
		for (let i = 0; i < arrowArray.length; i++) {
			arrowArray[i].draw();
		}
	}

	function drawArrow(ctx, fromx, fromy, tox, toy, arrowWidth, color) {
		//variables to be used when creating the arrow
		var headlen = 10;
		var angle = Math.atan2(toy - fromy, tox - fromx);

		ctx.save();
		ctx.strokeStyle = color;

		//starting path of the arrow from the start square to the end square
		//and drawing the stroke
		ctx.beginPath();
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.lineWidth = arrowWidth;
		ctx.stroke();

		//starting a new path from the head of the arrow to one of the sides of
		//the point
		ctx.beginPath();
		ctx.moveTo(tox, toy);
		ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7),
			toy - headlen * Math.sin(angle - Math.PI / 7));

		//path from the side point of the arrow, to the other side point
		ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 7),
			toy - headlen * Math.sin(angle + Math.PI / 7));

		//path from the side point back to the tip of the arrow, and then
		//again to the opposite side point
		ctx.lineTo(tox, toy);
		ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7),
			toy - headlen * Math.sin(angle - Math.PI / 7));

		//draws the paths created above
		ctx.stroke();
		ctx.restore();
	}


	if (document.getElementById("arrow")) {
		arrowFlash();
	}

	setup();

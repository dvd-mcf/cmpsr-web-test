var theDevice
var port1
var port2

var device1
var device2;


WebMidi.enable()

async function setup() {
	
	chooseMIDIInput()
    // Create AudioContext
    const WAContext = window.AudioContext || window.webkitAudioContext;
    const context = new WAContext();

    // Create gain node and connect it to audio output
    const outputNode = context.createGain();
    outputNode.connect(context.destination);
	
	// DEVICE 1
	
    const patchExportURL1 = "export/patch1.export.json";
    
    // Fetch the exported patcher
    let response, patcher;

	
    try {
        response = await fetch(patchExportURL1);
        patcher = await response.json();
    
        if (!window.RNBO) {
            // Load RNBO script dynamically
            // Note that you can skip this by knowing the RNBO version of your patch
            // beforehand and just include it using a <script> tag
            await loadRNBOScript(patcher.desc.meta.rnboversion);
        }
    } catch (err) {
        const errorContext = {
            error: err
        };
        if (response && (response.status >= 300 || response.status < 200)) {
            errorContext.header = `Couldn't load patcher export bundle`,
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
    
    // (Optional) Fetch the dependencies
    let dependencies = [];
    try {
        const dependenciesResponse = await fetch("export/dependencies.json");
        dependencies = await dependenciesResponse.json();

        // Prepend "export" to any file dependenciies
        dependencies = dependencies.map(d => d.file ? Object.assign({}, d, { file: "export/" + d.file }) : d);
    } catch (e) {}
    // Create the device
	
	
    try {

// Changing the name of the variable 'patcher' breaks the createDevice function		
        device1 = await RNBO.createDevice({ context, patcher });
	console.log(patcher)
    } catch (err) {
        if (typeof guardrails === "function") {
            guardrails({ error: err });
        } else {
            throw err;
        }
        return;
    }


    // (Optional) Load the samples
    if (dependencies.length)
        await device1.loadDataBufferDependencies(dependencies);

    // Connect the device1 to the web audio graph
    device1.node.connect(outputNode);
    // (Optional) Extract the name and rnbo version of the patcher from the description
    document.getElementById("patcher-title1").innerText = (patcher.desc.meta.filename || "Unnamed Patcher") + " (v" + patcher.desc.meta.rnboversion + ")";

    // (Optional) Automatically create sliders for the device parameters

    // (Optional) Create a form to send messages to RNBO inputs
//    makeInportForm(device);

    // (Optional) Attach listeners to outports so you can log messages from the RNBO patcher
//    attachOutports(device);

    // (Optional) Load presets, if any
//    loadPresets(device1, patcher, 1);

    // (Optional) Connect MIDI inputs

console.log("Device 1 created.")
// DEVICE 2

    const patchExportURL2 = "export/patch4.export.json";
    patcher = null
    // Fetch the exported patcher
//    let response, patcher;

	
    try {
        response2 = await fetch(patchExportURL2);
        patcher = await response2.json();
    
        if (!window.RNBO) {
            // Load RNBO script dynamically
            // Note that you can skip this by knowing the RNBO version of your patch
            // beforehand and just include it using a <script> tag
            await loadRNBOScript(patcher.desc.meta.rnboversion);
        }
    } catch (err) {
        const errorContext = {
            error: err
        };
        if (response && (response.status >= 300 || response.status < 200)) {
            errorContext.header = `Couldn't load patcher export bundle`,
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
    
    // (Optional) Fetch the dependencies

    // Create the device
	
	
    try {
		
        device2 = await RNBO.createDevice({ context, patcher });

    } catch (err) {
        if (typeof guardrails === "function") {
            guardrails({ error: err });
        } else {
            throw err;
        }
        return;
    }


    // (Optional) Load the samples
    if (dependencies.length)
        await device2.loadDataBufferDependencies(dependencies);

    // Connect the device1 to the web audio graph
	console.log("Connecting device 2...")
    device2.node.connect(outputNode);
    // (Optional) Extract the name and rnbo version of the patcher from the description
    document.getElementById("patcher-title2").innerText = (patcher.desc.meta.filename || "Unnamed Patcher") + " (v" + patcher.desc.meta.rnboversion + ")";



//load preset 2
//    loadPresets(device2, patcher, 2);

//make sliders
    makeSliders(device1, "rnbo1-parameter-sliders");

    makeSliders(device2, "rnbo2-parameter-sliders");



//makeMIDIListener
    makeMIDIListener(device1, 0);
    makeMIDIListener(device2, 1);

	

    document.body.onclick = () => {
        context.resume();
    }

    // Skip if you're not using guardrails.js
    if (typeof guardrails === "function")
        guardrails();
	
	
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
        uiElements[param.name] = { slider, text };

        // Add the slider element
        pdiv.appendChild(sliderContainer);
    });


    // Listen to parameter changes from the device
    thisDevice.parameterChangeEvent.subscribe(param => {
        if (!isDraggingSlider)
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

function changeInputs(){
	var select1 = document.getElementById("input1-select");
	var value1 = select1.selectedIndex

	console.log(value1);

	var select2 = document.getElementById("input2-select");
	var value2 = select2.selectedIndex
	
	console.log(value2);
	
	for (var i = 0; i < WebMidi.inputs.length; i++) {
	    const mySynth = WebMidi.inputs[i];
	    mySynth.channels[1].removeListener("noteon")
			
	}
	
	
    makeMIDIListener(device1, value1);
    makeMIDIListener(device2, value2);
	
}



function makeMIDIListener(device, port) {
	console.log("Making notes: " + device + ", " + port)
    let mdiv = document.getElementById("rnbo-clickable-keyboard");
    if (device.numMIDIInputPorts === 0) return;

//    mdiv.removeChild(document.getElementById("no-midi-label"));
	

   
	//	console.log(WebMidi.inputs[2]);
//	listInputsAndOutputs(WebMidi);
    const mySynth = WebMidi.inputs[port];
	console.log("Synth: " + mySynth)
    // const mySynth = WebMidi.getInputByName("TYPE NAME HERE!")
  
    mySynth.channels[1].addListener("noteon", e => {
	  
      let midiChannel = 0;

      // Format a MIDI message paylaod, this constructs a MIDI on event
      let noteOnMessage = [
          144 + midiChannel, // Code for a note on: 10010000 & midi channel (0-15)
          e.note.number, // MIDI Note
          100 // MIDI Velocity
		  
      ];
  
      let noteOffMessage = [
          128 + midiChannel, // Code for a note off: 10000000 & midi channel (0-15)
          e.note.number, // MIDI Note
          0 // MIDI Velocity
      ];
  
      // Including rnbo.min.js (or the unminified rnbo.js) will add the RNBO object
      // to the global namespace. This includes the TimeNow constant as well as
      // the MIDIEvent constructor.
      let midiPort = 0;
      let noteDurationMs = 250;
  
      // When scheduling an event to occur in the future, use the current audio context time
      // multiplied by 1000 (converting seconds to milliseconds) for now.
      let noteOnEvent = new RNBO.MIDIEvent(device.context.currentTime * 1000, midiPort, noteOnMessage);
      let noteOffEvent = new RNBO.MIDIEvent(device.context.currentTime * 1000 + noteDurationMs, midiPort, noteOffMessage);
  
      device.scheduleEvent(noteOnEvent);
      device.scheduleEvent(noteOffEvent);
	  
	  
	  
  });
	
  function playNote(note) {
  	console.log(note)
	
  	console.log("THE DEVICE: " + theDevice)
      let mdiv = document.getElementById("rnbo-clickable-keyboard");
      if (device.numMIDIInputPorts === 0) return;

      mdiv.removeChild(document.getElementById("no-midi-label"));

      const midiNotes = [49, 52, 56, 63];
      midiNotes.forEach(note => {
          const key = document.createElement("div");
          const label = document.createElement("p");
          label.textContent = note;
          key.appendChild(label);
          key.addEventListener("pointerdown", () => {
              let midiChannel = 0;

              // Format a MIDI message paylaod, this constructs a MIDI on event
              let noteOnMessage = [
                  144 + midiChannel, // Code for a note on: 10010000 & midi channel (0-15)
                  note, // MIDI Note
                  100 // MIDI Velocity
              ];
        
              let noteOffMessage = [
                  128 + midiChannel, // Code for a note off: 10000000 & midi channel (0-15)
                  note, // MIDI Note
                  0 // MIDI Velocity
              ];
        
              // Including rnbo.min.js (or the unminified rnbo.js) will add the RNBO object
              // to the global namespace. This includes the TimeNow constant as well as
              // the MIDIEvent constructor.
              let midiPort = 0;
              let noteDurationMs = 250;
        
              // When scheduling an event to occur in the future, use the current audio context time
              // multiplied by 1000 (converting seconds to milliseconds) for now.
              let noteOnEvent = new RNBO.MIDIEvent(device.context.currentTime * 1000, midiPort, noteOnMessage);
              let noteOffEvent = new RNBO.MIDIEvent(device.context.currentTime * 1000 + noteDurationMs, midiPort, noteOffMessage);
        
              device.scheduleEvent(noteOnEvent);
              device.scheduleEvent(noteOffEvent);

              key.classList.add("clicked");
          });

          key.addEventListener("pointerup", () => key.classList.remove("clicked"));

          mdiv.appendChild(key);
      });
  }	
	
	
	
	
}


function chooseMIDIInput() {
  navigator.requestMIDIAccess().then(function(midiAccess) {
    console.log("Input requested")
    var inputs = midiAccess.inputs;
        console.log(inputs)

    var inputSelect1 = document.getElementById("input1-select");
    var inputSelect2 = document.getElementById("input2-select");

    // Clear the input select options
    inputSelect1.innerHTML = "";
    inputSelect2.innerHTML = "";

    // Add an option for each available MIDI input
    for (var input of inputs.values()) {
      var option = document.createElement("option");
      option.value = input.id;
      option.text = input.name;
      inputSelect1.add(option);
//      inputSelect2.add(option); 
	  
    }
	
	//I don't understand why this won't work in one for loop but it doesn't
    for (var input of inputs.values()) {
      var option = document.createElement("option");
      option.value = input.id;
      option.text = input.name;
      inputSelect2.add(option); 
    }
	
	

    // Set the selected options to the last used inputs
    var lastInputs = JSON.parse(localStorage.getItem("lastMIDIInputs"));
    if (lastInputs) inputSelect1.value = lastInputs;
	    if (lastInputs) inputSelect2.value = lastInputs;
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






setup();


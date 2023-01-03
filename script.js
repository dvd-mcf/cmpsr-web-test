var input1

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


function startListening(inputId) {
	
input1 = inputId
	
console.log(inputId)
	
  navigator.requestMIDIAccess().then(function(midiAccess) {
    // Stop listening for MIDI messages from the previously selected inputs
    var previousInputIds = JSON.parse(localStorage.getItem("selectedInputIds"));
	console.log(previousInputIds)
    if (previousInputIds) {
		var input = midiAccess.inputs.get(previousInputIds);
        input.onmidimessage = null;
      
    }

    // Start listening for MIDI messages from the new inputs

  	  console.log(inputId);
		
			console.log("Listening on " + inputId + "...")
      var input = midiAccess.inputs.get(inputId);
      input.onmidimessage = function(event) {
        handleMIDIMessage(inputId, event);
      };
    

    // Store the selected input IDs in local storage
    localStorage.setItem("selectedInputIds", JSON.stringify(inputId));
  });
}

function handleMIDIMessage(inputId, event) {
  if (inputId == input1) {
	     console.log(inputId + ": " + event.data)
	  
	  var note = event.data[0]
	  
	  playNote(note)
	  
	  
	  
//    handleInput1Message(event);
  } else if (inputId == "input2") {
    handleInput2Message(event);
	   console.log(InputId + ": " + event.data)
  } // etc.
}

function handleInput1Message(event) {
  //
}
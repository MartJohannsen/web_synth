window.AudioContext = window.AudioContext || window.webkitAudioContext;

let ctx;

const startButton = document.querySelector('button');
var waveSelect = document.getElementById('wave');


const oscillators = {};

startButton.addEventListener('click', () => {
    ctx = new AudioContext();
    console.log(ctx);
})


function midiToFreq(midiNumber) {
    const a = 440;
    return (a / 32) * (2 ** ((midiNumber - 9) / 12));
}

if(navigator.requestMIDIAccess){
    navigator.requestMIDIAccess().then(success, failure);
}

function success(midiAccess) {
    midiAccess.addEventListener('statechange', updateDevices);

    const inputs = midiAccess.inputs;

    inputs.forEach((input) => {
        input.addEventListener('midimessage', handleInput);
    })
}

function failure() {
    console.log('Could not connect');
}

function updateDevices(event) {
    console.log('Name: '+ event.port.name + ' Brand: ' + event.port.manufacturer +' State: '+ event.port.state + ' Type: ' + event.port.type);

}

function handleInput(input) {
    const command = input.data[0];
    const note = input.data[1];
    const velocity = input.data[2];
    console.log(command, note, velocity);

    switch(command) {
        case 144: //noteOn
            if (velocity>0){
                // note is on
                noteOn(note, velocity);
            } else {
                // note is off
                noteOff(note);
            }
            break;
        case 128: //noteOff
            noteOff(note);
            break;
    }
}

function noteOn(note, velocity) {
    const osc = ctx.createOscillator();
    var selectedWave = waveSelect.value;
    console.log(selectedWave);
    console.log(oscillators);
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.33;


    const velocityGainAmount = (1 / 127) * velocity;
    const velocityGain = ctx.createGain();

    velocityGain.gain.value = velocityGainAmount;

    osc.type = selectedWave;
    osc.frequency.value = midiToFreq(note);
    
    osc.connect(oscGain);
    oscGain.connect(velocityGain)
    velocityGain.connect(ctx.destination);

    osc.gain = oscGain;
    oscillators[note.toString()] = osc;

    osc.start();
}

function noteOff(note) {
    const osc = oscillators[note.toString()];
    const oscGain = osc.gain;

    oscGain.gain.setValueAtTime(oscGain.gain.value, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

    setTimeout(() => {
        osc.stop(); 
        osc.disconnect();
    }, 20)



    delete oscillators[note.toString()];
    console.log(oscillators);
}
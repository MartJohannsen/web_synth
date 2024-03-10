window.AudioContext = window.AudioContext || window.webkitAudioContext;

let ctx;

const startButton = document.getElementById('ctxStarter');

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
    synths.forEach(function(synth, index){
        const osc = ctx.createOscillator();
        var selectedWave = synth.wave;
        console.log(selectedWave);
        const oscGain = ctx.createGain();
        oscGain.gain.value = synth.gain;
    
    
        const velocityGainAmount = (1 / 127) * velocity;
        const velocityGain = ctx.createGain();
    
        velocityGain.gain.value = velocityGainAmount;
    
        osc.type = selectedWave;
        osc.frequency.value = midiToFreq(note);
        
        osc.connect(oscGain);
        oscGain.connect(velocityGain)
        velocityGain.connect(ctx.destination);
    
        osc.gain = oscGain;
        synth.oscillators[note.toString()] = osc;
    
        osc.start();
    })
    
}

function noteOff(note) {
    synths.forEach(function(synth, index){
        const osc = synth.oscillators[note.toString()];
        const oscGain = osc.gain;
    
        oscGain.gain.setValueAtTime(oscGain.gain.value, ctx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
    
        setTimeout(() => {
            osc.stop(); 
            osc.disconnect();
        }, 20)
    
        delete synth.oscillators[note.toString()];
        console.log(synth.oscillators);
    })
    console.log(synths);
}


function Synth() {
    return {
    gain: 0.22,
    sustain: 0,
    wave: "sine",
    transpose: 0,
    oscillators: []
    }
}

var synths = [];

function newSynth(){
    synths[synths.length] = new Synth();
    /* if(synths.length == 2) {
        synths[synths.length-1].wave = "sawtooth"
        synths[synths.length-1].gain = 0.01
    } */

    var synthsHtml = '';
    synths.forEach(function(synth,index) {
        console.log(index);
        synthsHtml += '<li>' + 
        '<select name="waves' + index + '" id="wave' + index + '">' +
            '<option value="square">square</option>' +
            '<option value="sine">sine</option>' +
            '<option value="sawtooth">sawtooth</option>' +
            '<option value="triangle">triangle</option>' +
        '</select>'
        + '</li>';
        
    })
    synthsHtml = '<ul>' + synthsHtml + '</ul>';
    
    document.getElementById("synthesizers").innerHTML = synthsHtml;
    
    // HVORDAN LYTTER VI TIL HVER UPDATE?
    synths.forEach(function(synth,index) {
        var value = document.getElementById("wave" + index);
        synth.wave = value.options[value.selectedIndex].text;
    })
}

const synthAdd = document.getElementById("addSynth");

synthAdd.addEventListener('click', () => {
    newSynth();
    
})

// PRINT EN NY SYNTH TIL HTML HVER GANG VI TILFØJER - BIND VÆRDIER SÅ VI KAN SKIFTE WAVEFORMS!


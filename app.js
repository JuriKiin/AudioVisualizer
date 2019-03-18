// ---------- Program Setup ----------

const PI = Math.PI; //Creating a const for us to use! Less typing!

let w = window.innerWidth;  //Get the width of the window.
let h = window.innerHeight; //Get the height of the window.

let renderer = new THREE.WebGLRenderer({antialias: true, alpha: true}); //Create our Renderer
renderer.setSize(w,h);  //Set our renderer size to our screen size
let scene = new THREE.Scene();  //Create our scene
let camera = new THREE.PerspectiveCamera( 75, w/h, 1, 1000 );   //Create camera
camera.position.set(0,0,175);   //Set the camera position
document.body.appendChild( renderer.domElement );   //Add our renderer element

/* use to update global w and h and reset canvas width/height */ 
function updateCanvasSize() {
    w = window.innerWidth;
    h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}
updateCanvasSize();
window.addEventListener('resize', updateCanvasSize);

// ---------- CREATING AUDIO ANALYZER ----------

// create an AudioListener and add it to the camera
let listener = new THREE.AudioListener();
camera.add( listener );

// create an Audio source
let sound = new THREE.Audio( listener );

// load a sound and set it as the Audio object's buffer
let audioLoader = new THREE.AudioLoader();
// create an AudioAnalyser, passing in the sound and desired fftSize
let analyser;

//---------- Main Code ----------

let cubes = [];             //Cube holder
let spheres = [];           //Sphere holder
let rotateSpeed = 0.005;    //Rotation speed
let time = 0;               //Our simulation time

//---------- Utility Functions ----------

//This function loads a sound into the loader and plays it. (Lets us access audio data)/
function loadAudio(soundPath,fttSize) {                         //String, Int
    analyser = new THREE.AudioAnalyser( sound, fttSize);        //Create our analyser
    audioLoader.load( soundPath, function( buffer ) {
        if(sound.isPlaying) sound.stop();
        sound.setBuffer( buffer );
        sound.setLoop(true);
        sound.setVolume(0.5);
        sound.play();
    });   //Create audio loader
}

//This utility function creates a line and returns it. [Does not add it to the scene]
function createLine(vertices,color) {                       //[V3], Color
    let geo = new THREE.Geometry();                         //Create the geometry
    let mat = new THREE.LineBasicMaterial({color: color});  //Create the material
    for(let i = 0; i < vertices.length; i++) {              //Loop through our verticies 
        geo.vertices.push(vertices[i]);                     //Add them to our geometry
    }           
    return new THREE.Line(geo,mat);                         //Return our line
} 

//This utility function creates a cube and returns it. [Does not add it to the scene]
function createCube(color, position, rotation, scale) {             //Color, V3, V3, V3
    let geometry = new THREE.BoxGeometry(1,1,1);                    //Create our geometry
    let material = new THREE.MeshLambertMaterial( {color: color} ); //Create material
    material.emissive = material.color;                             //Set the emissive property to objects color
    let cube = new THREE.Mesh( geometry, material );                //Create the mesh
    cube.position.copy(position);                                   //Set the position
    cube.rotation.set(rotation.x,rotation.y,rotation.z);            //Set the rotation
    cube.scale.copy(scale);                                         //Set the scale
    return cube;                                                    //Return the cube.
}

//This utility function creates a sphere and returns it. [Does not add it to the scene]
function createSphere(position,rotation,radius,wTri,hTri,color) {   //V3, V3, Float, Int, Int, Color
    let geometry = new THREE.SphereGeometry( radius, wTri, hTri );  //Create Geometry
    let material = new THREE.MeshBasicMaterial( {color: color} );   //Create Material
    let sphere = new THREE.Mesh( geometry, material );              //Create our mesh
    sphere.position.copy(position);                                 //Set the position
    sphere.rotation.set(rotation.x,rotation.y,rotation.z);          //Set the rotation
    return sphere;                                                  //Return the sphere.
}

//Generate some cubes in a given radius
function generateCubesInCircle(radius) {    //Float
    cubes = []; //Reset our cube array
    for(let i = 0; i < analyser.data.length; i++) { //Loop through each frequency data point
        let angle = (2 * PI * i) / analyser.data.length;	//Angle between vertices (based on subdivisions)
        let x = Math.cos(angle) * radius;	//Get xPosition
        let y = Math.sin(angle) * radius;	//Get zPosition
        //Create a new cube
        let cube = createCube('hsl(' + (255+i) + ',100%,50%)',new THREE.Vector3(x,y,0),new THREE.Euler(0,0,angle),new THREE.Vector3(1,1,1))
        cubes.push(cube);   //Add our cube to our array for tracking
        scene.add(cube);    //Add the cube to the scene.
    }   
}

//Generate spheres with a starting radius.
function generateSpheres(count,radius) {    //Float, Float
    for(let i = 1; i < count+1; i++) {  //Loop through our count
        //Create our sphere
        let sphere = createSphere(new THREE.Vector3(0,0,i*5),new THREE.Vector3(0,0,0), radius - i*2, 32,32, 'hsl('+i*count+',100%,50%)');
        sphere.scale.z = 0.5;   //Set our scale so we aren't Clipping
        spheres.push(sphere);   //Push our sphere to our array for tracking.
        scene.add(sphere);      //Add the sphere to the scene.
    }
}

//---------- Drawing Function ----------

function draw(t) { 
    let freq = analyser.getAverageFrequency();  //Get our frequency data
    for(let i = 0; i < analyser.data.length; i++) { //Loop through each data point
        let cube = cubes[i];    //get the corresponding cube.
        analyser.data[i] == 0 ? cube.visible = false : cube.visible = true; //Only render if data isn't empty.
        cube.scale.x = Math.max(analyser.data[i]/2,1)/2;    //Scale the cube in the x axis
        i % 2 == 0 ? cube.rotateZ(rotateSpeed) : cube.rotateZ(-rotateSpeed);    //Alternate rotating directions.
    }
    
    for(let i = 0; i < spheres.length; i++) {   //Loop through our spheres
        let sphere = spheres[i];    //get our sphere object
        analyser.data[i] == 0 ? sphere.visible = false : sphere.visible = true;
        
        sphere.scale.set(Math.max(analyser.data[i]/100,0.01),Math.max(analyser.data[i]/100,0.01),0.5);  //Set the scale.
    }
    
	renderer.render( scene, camera );  //Render our scene
    time++; //Increment Time
    requestAnimationFrame(draw);    //Recall our main draw function
}

//---------- Function Calls ----------
loadAudio('sounds/Blip.mp3', 512); //Load this sound by default. (Sound path, fttSize)
generateCubesInCircle(100);
generateSpheres(10,25);
requestAnimationFrame(draw);    //Start Animation.

//---------- Event Listeners ----------
let select = document.getElementById('select');

select.addEventListener('change', function() {
    loadAudio(select.value,512);
});


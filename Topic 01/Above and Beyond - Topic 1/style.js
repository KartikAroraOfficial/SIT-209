import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js';

/** vertex shader source */
const vertexShader = `
uniform float uTime;
float PI = 3.14159265359;
varying vec3 vPosition;

void main(){
  float num = position.z / 10000.0;
  float len = length(position) * 0.001;
  
  vec3 pos; 
  pos.x = cos(position.x * position.y) * sin(uTime * num) * 1.0;
  pos.y = sin(position.x * position.y) * sin(uTime * num) * 1.0;
  pos.z = tan(uTime + len) * 0.1;
  
  vPosition = pos;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  
  gl_PointSize = 6.0 * (12.0 / - mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}

`;

/** fragment shader source */
const fragmentShader = `
varying vec3 vPosition;
uniform float uTime;

/**
 * change colors
 * Referred to
 * https://iquilezles.org/www/articles/palettes/palettes.htm
 * Thank you so much.
 */
vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
  return a + b*cos( 6.28318*(c*t+d) );
}

void main () {
  /**
   * Square to Circle.
   * Referred to
   * https://qiita.com/uma6661/items/20accc9b5fb9845fc73a
   * Thank you so much.
   */
  float f = length(gl_PointCoord - vec2(0.5, 0.5));
  if ( f > 0.1 ) discard;
  
  vec3 color =
    palette(
      length(vPosition) - uTime * 0.5, 
      vec3(0.5,0.5,0.5),
      vec3(0.5,0.5,0.5),
      vec3(1.0,1.0,0.5),
      vec3(0.8,0.90,0.30)
    );
  
  gl_FragColor = vec4(color, 1.0);
}

`;

/**
 * class Sketch
 */
class Sketch {
  constructor() {
    /** renderer */
    this.renderer =
      new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });
    document.getElementById('container').appendChild(this.renderer.domElement);
    
    this.statsInit();
    this.init();
  }

  statsInit() {
    this.stats = new Stats();
    this.stats.setMode(0);
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.left = '0';
    this.stats.domElement.style.top = '0';
    document.getElementById('container').appendChild(this.stats.domElement);
  }
  
  init() {
    /** time */
    this.time = new THREE.Clock(true);
    
    /** mouse */
    this.amp = 10.0;
    this.mouse = new THREE.Vector2();
    this.touchStart = new THREE.Vector2();
    this.touchMove = new THREE.Vector2();
    this.touchEnd = new THREE.Vector2();
    
    /** canvas size */
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    /** scene */
    this.scene = new THREE.Scene();
    
    /** setup and render */
    this.setupCanvas();
    this.setupCamera();
    //this.setupLight();
    this.setupShape();
    this.setupEvents();
    
    this.render();
  }
  
  setupCanvas() {
    /** renderer */
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 1.0);
    
    /** style */
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '0';
    this.renderer.domElement.style.outline = 'none';
  }
  
  setupCamera() {
    const fov = 70;
    const fovRadian = (fov / 2) * (Math.PI / 180);
    
    this.dist = this.height / 2 / Math.tan(fovRadian);
    this.camera =
      new THREE.PerspectiveCamera(
        fov,
        this.width / this.height,
        0.01,
        1000
      );
    this.camera.position.set(0, 0.0, 2.0);
    this.camera.lookAt(new THREE.Vector3());
    this.scene.add(this.camera);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  
  setupLight() {
    /** directinal light */
    this.directionalLight = new THREE.DirectionalLight(0xffffff);
    this.scene.add(this.directionalLight);

    /** point light*/
    this.spotLight = new THREE.SpotLight(0xffffff);
    this.spotLight.position.set(0, 300, 0);
    this.scene.add(this.spotLight);
  }
  
  setupShape() {
    this.shapes = new Array();
    const s = new Shape(this);
    this.shapes.push(s);
  }
  
  setupGui() {
    this.settings = {
      scale: 3,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, 'scale', 1, 10, 1).onChange(() => this.init());
  }
  
  render() {
    this.stats.begin(); // -------------------- //
    
    const time = this.time.getElapsedTime();
    
    /** shapes */
    for (let i = 0; i < this.shapes.length; i++) {
      this.shapes[i].update(time);
    }
    
    this.renderer.render(this.scene, this.camera);
    
    this.stats.end();   // -------------------- //
    this.animationId = requestAnimationFrame(this.render.bind(this));
  }
  
  setupEvents() {
    window.addEventListener('resize', this.onResize.bind(this), false);
    window.addEventListener('mousemove', this.onMousemove.bind(this), false);
    this.renderer.domElement.addEventListener('wheel', this.onWheel.bind(this), false);
    this.renderer.domElement.addEventListener('touchstart', this.onTouchstart.bind(this), false);
    this.renderer.domElement.addEventListener('touchmove', this.onTouchmove.bind(this), false);
    this.renderer.domElement.addEventListener('touchend', this.onTouchend.bind(this), false);
  }
  
  onResize() {
    const id = this.animationId;
    
    cancelAnimationFrame(id);
    this.init();
  }
  
  onMousemove(event) {
    this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  }
  
  onWheel(event) {
    this.amp += event.deltaY * 0.05;
  }
  
  onTouchstart(event) {
    const touch = event.targetTouches[0];
    
    this.touchStart.x = touch.pageX;
    this.touchStart.y = touch.pageY;
  }
  
  onTouchmove(event) {
    const touch = event.targetTouches[0];
    
    this.touchMove.x = touch.pageX;
    this.touchMove.y = touch.pageY;
    this.touchEnd.x = this.touchStart.x - this.touchMove.x;
    this.touchEnd.y = this.touchStart.y - this.touchMove.y;
    
    this.amp += this.touchEnd.y * 0.05;
    
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
  }

  onTouchend(event) {
    this.touchStart.x = null;
    this.touchStart.y = null;
    this.touchMove.x = null;
    this.touchMove.y = null;
    this.touchEnd.x = null;
    this.touchEnd.y = null;
    
    this.mouse.x = null;
    this.mouse.y = null;
  }
}

/**
 * shape class
 */
class Shape {
  /**
   * @constructor
   * @param {object} sketch - canvas
   */
  constructor(sketch) {
    this.sketch = sketch;
    this.init();
  }
  
   /**
   * initialize shape
   */
  init() {
    /** particles */
    this.count = this.sketch.width < 500 ? 10000 : 10000;
    this.geometry = new THREE.BufferGeometry();
    this.vertices = new Float32Array(this.count * 3);
    
    for (let i = 0; i < this.count * 3; i++) {
      this.vertices[i * 3 + 0] = Math.PI * 2 / this.count;
      this.vertices[i * 3 + 1] = i * 3;
      this.vertices[i * 3 + 2] = i * 3;
    }
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.vertices, 3));
    
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        uTime: {type: 'f', value: 0},
        uResolution: {
          type: 'v2',
          value: new THREE.Vector2(this.sketch.width, this.sketch.height),
        },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });
    
    this.mesh = new THREE.Points(this.geometry, this.material);
    //this.mesh.rotation.set(-90 * Math.PI / 180, 0.0, 0.0);
    this.sketch.scene.add(this.mesh);
  }
  
  /**
   * update shape
   * @param {number} time - time 
   */
  update(time) {
    this.mesh.material.uniforms.uTime.value = time;
  }
}

(() => {
  window.addEventListener('load', () => {
    console.clear();

    const loading = document.getElementById('loading');
    loading.classList.add('loaded');

    new Sketch();
  });
})();
/* 基础数据 */
var scene;
var renderer;
var container;
var winWidth;
var winHeight;
var cameraAspect;

function prepare() {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer();

    /* 取得一些基本信息 */
    container = document.createElement( 'div' );
    document.body.appendChild(container);

    winWidth = window.innerWidth;
    winHeight = window.innerHeight;
    cameraAspect = winWidth / winHeight;

    renderer.setSize(winWidth, winHeight);
    container.appendChild(renderer.domElement);

    init();
}

/* .................... */

var zDistance = 50;

/**
 * 图片处理
 */
var preLoadDone = false;
var DENSITY = 8;
var scaledWidth, scaledHeight;

var image = document.createElement('img');
var imageURL = "../assets/images/indienova.png";
var canvas = document.createElement('canvas');
var maxBoxSize = 512;
var context	= canvas.getContext('2d');

var particleSystem, particles, colors;
var camera;

function init() {
    /* Camera */
    camera = new THREE.PerspectiveCamera(65, cameraAspect, 10, 100000);
    camera.position.z = 800;

    /* Orbit 控制 */
    var controls = new THREE.OrbitControls(camera, renderer.domElement);

    var loader = new THREE.ImageLoader();
    loader.load(imageURL, imageLoaded);
}

/* 载入图片 */
function imageLoaded() {
    console.log('# 图片预载入完成');
    image.src = imageURL;

    // 绘制图片，并且确保它在屏幕大小内（其实并不可见）
    setTimeout(drawImage, 1000);
}

function drawImage() {
    // 确定图片获取范围
    var ratio = Math.min(image.width / maxBoxSize, image.height / maxBoxSize);
    scaledWidth = Math.floor(ratio * image.width);
    scaledHeight = Math.floor(ratio * image.height);
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    context.drawImage(image, 0, 0, scaledWidth, scaledHeight);

    pixels = context.getImageData(0, 0, scaledWidth, scaledHeight);

    console.log('原始尺寸：', image.width, 'x', image.height);
    console.log('绘制尺寸：', scaledWidth, 'x', scaledHeight);

    //container.appendChild(canvas);

    addParticles();
}

function addParticles() {
    // 设置粒子的材质
    var loader   = new THREE.TextureLoader();
    var material = new THREE.PointsMaterial({
        size: DENSITY,
        sizeAttenuation: false,
        map: loader.load("../assets/images/particle.png"),
        alphaTest: 0.5,
        transparent: true,
        vertexColors:true});
    var geometry = new THREE.Geometry();
    var step = DENSITY * 4;
    var x, y;

    // 循环图像的每个像素（与 DENSITY 相关）
    for (x = 0; x < scaledWidth * 4; x += step) {
        for (y = scaledHeight-1; y >= 0 ; y -= DENSITY) {
            var p = ((y * scaledWidth * 4) + x);
            // 获取像素点数据，跳过透明的
            if (pixels.data[p+3] > 0) {
                var pixelCol = (pixels.data[p] << 16) + (pixels.data[p+1] << 8) + pixels.data[p+2];
                var color = new THREE.Color(pixelCol);
                var vector = new THREE.Vector3(-scaledWidth/2 + x/4, scaledHeight/2 - y, 0);

                // 插入数据
                geometry.vertices.push(vector);
                geometry.colors.push(color);
            }
        }
    }

    // 现在创建一个新粒子体系
    //material.color.setHSL( 1.0, 0.3, 0.7 );
    particleSystem 	= new THREE.Points(geometry, material);
    particleSystem.sortParticles = true;

    // 粒子的值
    particles = particleSystem.geometry.vertices;
    colors = particleSystem.geometry.colors;

    // 设置粒子的详细数据
    var ps = particles.length;
    while(ps--) {
        var particle = particles[ps];
        particle.origPos = new THREE.Vector3(particle.x, particle.y, particle.z);
    }

    // gc and add
    pixels = null;
    scene.add(particleSystem);

    camera.lookAt(scene.position);

    console.log('粒子加入完成');

    // add subtle ambient lighting
    var ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    // directional lighting
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0, 2, 2).normalize();
    scene.add(directionalLight);

    /* 渲染 */
    preLoadDone = true;
    render();
}

/* 渲染方法 */
function update() {
    var ps = particles.length;
    while(ps--) {
        var particle = particles[ps];
        particle.z = particle.origPos.z + Math.random() * zDistance - zDistance/2;
    }
    particleSystem.geometry.verticesNeedUpdate = true;

    // set up a request for a render
    requestAnimationFrame(render);
}

var render = function () {
    if (preLoadDone)
        renderer.render(scene, camera);
    update();
};

/* ........................................ */

/* window load */
window.addEventListener('load', function() {

    console.log(0);

    if (!Detector.webgl)
        Detector.addGetWebGLMessage();
    else
        prepare();
});

/* window resize */
window.addEventListener('resize', function() {
    winWidth = window.innerWidth;
    winHeight = window.innerHeight;
    cameraAspect = winWidth / winHeight;

    renderer.setSize(winWidth, winHeight);
    camera.aspect = cameraAspect;
    camera.updateProjectionMatrix();
    if(typeof(onResize)=="function"){
        onResize();
    }
});
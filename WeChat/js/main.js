import * as THREE from 'libs/three.js'

const zDistance   = 50
const DENSITY     = 8
const maxBoxSize  = 512

const image       = document.createElement('img')
const imageURL    = "images/indienova.png"
const particleURL = "images/particle.png"

let ctx   = canvas.getContext('webgl')

let scene
let renderer
let camera

let preLoadDone  = false;
let scaledWidth
let scaledHeight

let pixels
let particleSystem, particles, colors

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    this.restart()
  }

  restart() {
    scene     = new THREE.Scene()
    renderer  = new THREE.WebGLRenderer({ context: ctx })

    const winWidth = window.innerWidth
    const winHeight = window.innerHeight
    const cameraAspect = winWidth / winHeight

    renderer.setSize(winWidth, winHeight)

    console.log("屏幕尺寸: " + winWidth + " x " + winHeight)

    camera = new THREE.PerspectiveCamera(65, cameraAspect, 10, 100000)
    camera.position.z = 800

    let loader = new THREE.ImageLoader()
    loader.load(imageURL, this.imageLoaded.bind(this))
  }

  /** 载入图片 */
  imageLoaded() {
    image.src = imageURL
    console.log('# 图片预载入完成', image)

    setTimeout(this.drawImage.bind(this), 1000)
  }

  drawImage() {
    // 绘制图片，并且确保它在屏幕大小内（其实并不可见）
    let ratio = Math.min(image.width / maxBoxSize, image.height / maxBoxSize)
    scaledWidth = Math.floor(ratio * image.width)
    scaledHeight = Math.floor(ratio * image.height)

    let offScreenCanvas = wx.createCanvas()
    offScreenCanvas.width = scaledWidth
    offScreenCanvas.height = scaledHeight
    let offScreenCtx = offScreenCanvas.getContext('2d')
    offScreenCtx.drawImage(image, 0, 0, scaledWidth, scaledHeight)
    pixels = offScreenCtx.getImageData(0, 0, scaledWidth, scaledHeight)
    offScreenCanvas = null

    //console.log('原始尺寸：', image.width, 'x', image.height)
    //console.log('绘制尺寸：', scaledWidth, 'x', scaledHeight)

    this.addParticles()
  }

  addParticles() {
    // 设置粒子的材质
    let loader   = new THREE.TextureLoader()
    let material = new THREE.PointsMaterial({
      size: DENSITY,
      sizeAttenuation: false,
      map: loader.load(particleURL),
      alphaTest: 0.5,
      transparent: true,
      vertexColors:true})
    let geometry = new THREE.Geometry()
    let step = DENSITY * 4
    let x, y

    // 循环图像的每个像素（与 DENSITY 相关）
    for (x = 0; x < scaledWidth * 4; x += step) {
      for (y = scaledHeight-1; y >= 0 ; y -= DENSITY) {
        let p = ((y * scaledWidth * 4) + x)
        // 获取像素点数据，跳过透明的
        if (pixels.data[p+3] > 0) {
          let pixelCol = (pixels.data[p] << 16) + (pixels.data[p+1] << 8) + pixels.data[p+2]
          let color = new THREE.Color(pixelCol)
          let vector = new THREE.Vector3(-scaledWidth/2 + x/4, scaledHeight/2 - y, 0)

          // 插入数据
          geometry.vertices.push(vector)
          geometry.colors.push(color)
        }
      }
    }

    // 现在创建一个新粒子体系
    particleSystem 	= new THREE.Points(geometry, material)
    particleSystem.sortParticles = true

    // 粒子的值
    particles = particleSystem.geometry.vertices
    colors = particleSystem.geometry.colors

    // 设置粒子的详细数据
    let ps = particles.length
    while(ps--) {
      let particle = particles[ps]
      particle.origPos = new THREE.Vector3(particle.x, particle.y, particle.z)
    }

    // gc and add
    pixels = null;
    scene.add(particleSystem)

    camera.lookAt(scene.position)

    console.log('粒子加入完成')

    // add subtle ambient lighting
    let ambientLight = new THREE.AmbientLight(0x222222)
    scene.add(ambientLight)

    // directional lighting
    let directionalLight = new THREE.DirectionalLight(0xffffff)
    directionalLight.position.set(0, 2, 2).normalize()
    scene.add(directionalLight)

    /* 渲染 */
    preLoadDone = true
    this.loop()
  }

  /**
   * 逻辑更新主函数
   */
  update() {
    // 更新代码
    if (preLoadDone) {
      let ps = particles.length
      while(ps--) {
        let particle = particles[ps]
        particle.z = particle.origPos.z + Math.random() * zDistance - zDistance/2
      }
      particleSystem.geometry.verticesNeedUpdate = true
    }
  }

  /**
   * canvas 重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    if (preLoadDone) {
      particleSystem.rotation.y += 0.01;
      renderer.render(scene, camera)
    }
  }

  // 实现帧循环
  loop() {
    this.update()
    this.render()

    window.requestAnimationFrame(
      this.loop.bind(this),
      canvas
    )
  }
}

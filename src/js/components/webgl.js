import * as THREE from 'three/build/three.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { throttle } from '../utils/throttle';
import { gsap } from 'gsap';

export default class Webgl {
    constructor() {
        this.wd = window.innerWidth;
        this.wh = window.innerHeight;
        this.halfWd = window.innerWidth * 0.5;
        this.halfWh = window.innerHeight * 0.5;
        this.sp = 768;
        this.ua = window.navigator.userAgent.toLowerCase();
        this.mq = window.matchMedia('(max-width: 768px)');
        this.elms = {
            canvas: document.querySelector('[data-canvas]'),
            mvTitle: document.querySelector('[data-mv="title"]'),
            mvSubTitle: document.querySelectorAll('[data-mv="subTitle"]'),
            mvHomeLink: document.querySelector('[data-mv="homeLink"]'),
            mvGitLink: document.querySelector('[data-mv="gitLink"]'),
        };
        this.three = {
            scene: null,
            renderer: null,
            camera: null,
            redraw: null,
            cameraFov: 50,
            cameraAspect: window.innerWidth / window.innerHeight,
            cloneObj: null,
        };
        this.srcObj = './obj/apple.gltf';
        this.flg = {
            loaded: false,
        };
        this.mousePos = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            moveX: 0.004,
            moveY: 0.003,
        };
        this.init();
    }
    init() {
        this.getLayout();
        this.initScene();
        this.initCamera();
        this.initRenderer();
        this.setLoading();
        this.setLight();
        this.handleEvents();

        if (this.ua.indexOf('msie') !== -1 || this.ua.indexOf('trident') !== -1) {
            return;
        } else {
            this.mq.addEventListener('change', this.getLayout.bind(this));
        }
    }
    getLayout() {
        this.sp = this.mq.matches ? true : false;
    }
    initScene() {
        this.three.scene = new THREE.Scene();
    }
    initCamera() {
        //(視野角, スペクト比, near, far)
        this.three.camera = new THREE.PerspectiveCamera(this.three.cameraFov, this.wd / this.wh, this.three.cameraAspect, 1000);
        this.three.camera.position.set(0, 0, 9);
    }
    initRenderer() {
        // レンダラーのサイズ調整
        this.three.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true, //背景色を設定しないとき、背景を透明にする
        });
        // this.three.renderer.setClearColor(0xffffff); //背景色
        this.three.renderer.setPixelRatio(window.devicePixelRatio);
        this.three.renderer.setSize(this.wd, this.wh);
        this.three.renderer.physicallyCorrectLights = true;
        this.three.renderer.shadowMap.enabled = true;
        this.three.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.elms.canvas.appendChild(this.three.renderer.domElement);
        this.three.renderer.outputEncoding = THREE.GammaEncoding;
    }
    setLight() {
        // 環境光源(色, 光の強さ)
        const ambientLight = new THREE.AmbientLight(0x666666);
        this.three.scene.add(ambientLight);

        const positionArr = [
            [0, 5, 0, 2],
            [-5, 3, 2, 2],
            [5, 3, 2, 2],
            [0, 3, 5, 1],
            [0, 3, -5, 2],
        ];

        for (let i = 0; i < positionArr.length; i++) {
            // 平行光源(色, 光の強さ)
            const directionalLight = new THREE.DirectionalLight(0xffffff, positionArr[i][3]);
            directionalLight.position.set(positionArr[i][0], positionArr[i][1], positionArr[i][2]);

            if (i == 0 || i == 2 || i == 3) {
                directionalLight.castShadow = true;
                directionalLight.shadow.camera.top = 50;
                directionalLight.shadow.camera.bottom = -50;
                directionalLight.shadow.camera.right = 50;
                directionalLight.shadow.camera.left = -50;
                directionalLight.shadow.mapSize.set(4096, 4096);
            }
            this.three.scene.add(directionalLight);
        }
    }
    setLoading() {
        const loader = new GLTFLoader();
        loader.load(this.srcObj, (obj) => {
            const data = obj.scene;

            data.traverse((n) => {
                //シーン上のすべてに対して
                n.castShadow = true;
                n.receiveShadow = true;
            });

            // クローンを作成
            this.three.cloneObj = data.clone();
            // クローンをシーンに追加
            this.three.scene.add(this.three.cloneObj);
            // サイズ
            this.three.cloneObj.scale.set(this.sp ? 0.5 : 1, this.sp ? 0.5 : 1, this.sp ? 0.5 : 1);
            // 位置
            this.three.cloneObj.position.set(this.sp ? 1 : 4.9, this.sp ? 0 : -4, this.sp ? -1.6 : -1.3);
            // 角度
            this.three.cloneObj.rotation.set(this.sp ? 0.1 : 0.2, this.sp ? 0 : 0.7, this.sp ? -0.3 : 0);

            this.three.redraw = data;
            this.three.scene.add(data);
            // サイズ
            this.three.redraw.scale.set(this.sp ? 0.5 : 1, this.sp ? 0.5 : 1, this.sp ? 0.5 : 1);
            // 位置
            this.three.redraw.position.set(this.sp ? -0.6 : 2, this.sp ? 0 : 5, this.sp ? 0 : 0);
            // 角度
            this.three.redraw.rotation.set(this.sp ? 0 : 0.1, this.sp ? 0.4 : -0.4, this.sp ? 0.2 : 0);

            this.flg.loaded = true;
            this.rendering();
        });
    }
    rendering() {
        // マウスの位置を取得
        this.mousePos.x += (this.mousePos.targetX - this.mousePos.x) * this.mousePos.moveX;
        this.mousePos.y += (this.mousePos.targetY - this.mousePos.y) * this.mousePos.moveY;

        this.three.redraw.position.x = this.sp ? -0.6 : 2 - this.mousePos.x * 0.7; //マウスの位置によって3dの位置をずらす
        this.three.camera.position.y = this.mousePos.y * -0.9; //マウスの位置によって3dの位置をずらす

        requestAnimationFrame(this.rendering.bind(this));
        this.three.renderer.render(this.three.scene, this.three.camera);
        this.animate(); // アニメーション開始
    }
    animate() {
        gsap.config({
            force3D: true,
        });
        const tl = gsap.timeline({
            paused: true,
            defaults: {
                duration: 0.6,
                ease: 'power2.inOut',
            },
        });
        tl.to(
            this.elms.mvTitle,
            {
                duration: 0.5,
                ease: 'power2.easeOut',
                stagger: 0.05,
                y: 0,
            },
            1
        );
        tl.to(
            this.elms.mvSubTitle,
            {
                duration: 0.2,
                ease: 'power2.easeOut',
                stagger: 0.03,
                y: 0,
            },
            1.3
        );
        tl.to(
            this.three.redraw.position,
            {
                duration: 0.8,
                ease: 'power2.easeOut',
                y: 0,
            },
            0.5
        );
        tl.to(this.elms.canvas, {
            duration: 0.8,
            ease: 'power2.easeOut',
            opacity: 1,
        });
        tl.to(
            this.three.cloneObj.position,
            {
                duration: 0.8,
                ease: 'power2.easeOut',
                y: 0,
            },
            0.35
        );
        tl.to(
            this.elms.mvHomeLink,
            {
                duration: 0.8,
                ease: 'power2.easeOut',
                opacity: 1,
            },
            1.6
        );
        tl.to(
            this.elms.mvGitLink,
            {
                duration: 0.8,
                ease: 'power2.easeOut',
                opacity: 1,
            },
            1.6
        );
        tl.play();
    }
    handleEvents() {
        window.addEventListener('pointermove', this.handleMouse.bind(this), false);
        window.addEventListener('resize', throttle(this.handleResize.bind(this)), false);
    }
    handleResize() {
        // リサイズ処理
        if (this.wd !== window.innerWidth) {
            this.wd = window.innerWidth;
            this.wh = window.innerHeight;
            this.halfWd = window.innerWidth * 0.5;
            this.halfWh = window.innerHeight * 0.5;
            this.three.cameraAspect = this.wd / this.wh;
            this.three.camera.aspect = this.wd / this.wh;
            this.three.camera.updateProjectionMatrix();
            this.three.renderer.setSize(this.wd, this.wh);
            this.three.renderer.setPixelRatio(window.devicePixelRatio);
        }
    }
    handleMouse(event) {
        this.mousePos.targetX = (this.halfWd - event.clientX) / this.halfWd;
        this.mousePos.targetY = (this.halfWh - event.clientY) / this.halfWh;
    }
}

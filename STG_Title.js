// Moduleのインポート
import * as THREE          from './three.module.js';
import { WEBGL }           from './WebGL.js';
import { EffectComposer }  from './postprocessing/EffectComposer.js';
import { RenderPass }      from './postprocessing/RenderPass.js';
import { UnrealBloomPass } from './postprocessing/UnrealBloomPass.js';
import { FilmPass }        from './postprocessing/FilmPass.js';

// Global変数の宣言（このプログラム全体で必要なもの）
let width, hight;
let scene;       //シーン
let renderer;    //レンダラー
let composer;    //コンポーザー
let camera;      //カメラ
let light;       //照明
let lightHelper; //照明の可視化
//表示して動かすもの
let box, sbox;
let circle = [3];
let press;
let item;
let opa = 1;


//////ここから下は関数定義//////////

async function Init_Title(render, w, h) {
    renderer = render;
    width = w;
    hight = h;
    await Init_TitleCamera();
    await Init_Three();
    await Init_Objects();
    console.log("Title:Completed");
}

// 環境の整備
function Init_Three() {
    // シーンを作成
    scene = new THREE.Scene();

    // コンポーザー設定
    let rendererScene = new RenderPass(scene, camera);
    let bloom = new UnrealBloomPass(new THREE.Vector2(width, hight), 2.5, 0.15, 0);
    let film = new FilmPass(0.6, 0.8, 512, false);
    film.renderToScreen = true;
    composer = new EffectComposer(renderer);
    composer.addPass(rendererScene);
    composer.addPass(bloom);
    composer.addPass(film);

    // 背景に色をつける
    scene.background = new THREE.Color("rgb(2, 1, 1)");;
}

// カメラを作成
function Init_TitleCamera() {
    const fov    = 60;
    const aspect = width/hight;
    const near   = 0.1;
    const far    = 30000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 60, 400);
    camera.rotation.x = -15 * (Math.PI/180);
}

// 表示するものを作ってシーンに追加する
function Init_Objects() {
    function init_box() {
        const boxGeometry = new THREE.BoxBufferGeometry(100, 100, 100);
        const edges = new THREE.EdgesGeometry(boxGeometry);
        const material = new THREE.LineBasicMaterial({ color: "#d2691e"})
        box = new THREE.LineSegments( edges, material );
        sbox = box.clone();
        sbox.scale.set(0.5, 0.5, 0.5);
        scene.add(box, sbox);
    }
    function init_circle() {
        const geometry1 = new THREE.PlaneBufferGeometry(80, 80);
        const geometry2 = new THREE.PlaneBufferGeometry(160, 160);
        const geometry3 = new THREE.PlaneBufferGeometry(240, 240);
        const tex = new THREE.TextureLoader().load('./Assets/imgs/Circle.png');
        const material = new THREE.MeshBasicMaterial(
            {map: tex, transparent: true} 
        );

        circle[0] = new THREE.Mesh(geometry1, material);
        circle[1] = new THREE.Mesh(geometry2, material);
        circle[2] = new THREE.Mesh(geometry3, material);
        circle.forEach(e => {
            e.position.set(0, -100, 0);
            e.rotation.set(-Math.PI/2, 0, 0);
        });
        scene.add(circle[0], circle[1], circle[2]);
    }
    function init_press() {
        const tex = new THREE.TextureLoader().load("./Assets/imgs/PressShotKey.png");
        const mat = new THREE.SpriteMaterial({map: tex});
        press = new THREE.Sprite(mat);
        press.position.set(0, -70, 200);
        press.scale.set(160, 40);
        scene.add(press);
    }

    init_box();
    init_circle();
    init_press();
}

// レンダリングだけする関数
function TitleRender() {
    composer.render();
}

// 毎フレーム時に実行されるイベント
function Title_Animation() {
    box.rotation.x += 0.01;
    box.rotation.y += 0.01;
    box.rotation.z += 0.01;
    sbox.rotation.x += 0.013;
    sbox.rotation.y -= 0.027;
    sbox.rotation.z += 0.013;

    circle[0].rotation.z += 0.043;
    circle[1].rotation.z -= 0.027;
    circle[2].rotation.z += 0.01;

    // 表示
    TitleRender();
}

export {Init_Title, Title_Animation};



// Moduleのインポート
import * as THREE        from './three.module.js';
import * as Title        from './STG_Title.js';
import { WEBGL }         from './WebGL.js';
import { GUI }           from './dat.gui.module.js';
import { OBJLoader2 }    from './Loaders/OBJLoader2.js';
import { MTLLoader }     from './Loaders/MTLLoader.js';
import { MtlObjBridge }  from './Loaders/obj2/bridge/MtlObjBridge.js';
import { FBXLoader }     from './Loaders/FBXLoader.js';

// WebGL2 が使えるかどうかのチェック
if ( WEBGL.isWebGL2Available() === false ) {
    document.body.appendChild( WEBGL.getWebGL2ErrorMessage() );
}

// Global変数の宣言（このプログラム全体で必要なもの）
const widthDef = 700; // 縦サイズデフォ
const hightDef = 800; // 横サイズデフォ
let width = 700; // 画面横サイズ
let hight = 800; // 画面縦サイズ
let ratio = 1;   // 比率
let SceneNum = 0; // シーン番号
let sceneMoving = false;
let debugUtil = false; /* デバグ表示 */

let loading = true;          // ロード判定
let loadImg = [new Image(), new Image()]; // ロード画像
let loadAngle = 0;           // 回転角度
let loadOpacity = 0;         // 非透過率

let frameCanvas; // フレーム用キャンバス
let frameCont;   // フレーム用コンテキスト
let frameImg;    // フレーム画像
let UIcanvas;  // UI用キャンバス 
let UIcontext; // UI用キャンバスコンテキスト
let scene;     // シーン
let renderer;  // レンダラー
let camera;    // カメラ
let light;     // 照明
let skyBG;     // 空背景
// レイヤー番号
const MAIN_L = 0, EFFECT_L = 1, BULLET_L = 2, BG_L = 3;

let score = 0;      // スコア
let combo = 0;      // コンボ
let comboGauge = 0; // コンボゲージ
const C_GAUGE_MAX = 120;
let continued = false; // コンテニュー待ち
let contiCtd = 0;
let stageMid = false;  // 中ボス判定
let stageBoss = false; // ボス判定
let warning = {
    imgs: [new Image(), new Image(), new Image()],
    enable: false,
    FC: 1
};
let result = {
    enable: false,
    FC : 1
}

let stage = []; // ステージデータ
let mbFrame; // 中ボスフレーム
let sbFrame; // ステージボスフレーム
let stageCount = 0;

let playerPlane;      // プレイヤー機体モデル
let boostL, boostR;   // ブーストエフェクトスプライト
let playerBits;       // プレイヤービット
let PBulletTex = [];  // プレイヤー弾画像２種
let muzzleFlashMat;   // マズルフラッシュ画像
let hitTex;           // ヒット画像
let bomber;           // ボンバー
const CORE_SIZE = 14; // コアサイズ

let comGaugeImg = new Image(); // コンボゲージImg
let comFrameImg = new Image(); // コンボフレームImg
let scoFrameImg = new Image(); // スコアフレームImg
let hpgaugeImg = new Image();  // HPゲージImg
let hpgFrameImg = new Image(); // HPゲージフレームImg
let hpgaugeY;
let hpGaugeMax;  // MAX HP

// SE
let sounds = {
    bomb01: new Audio(),
    bomb02: new Audio(),
    bomb03: new Audio(),
    bomb04: new Audio(),
    bomb05: new Audio(),
    bomb06: new Audio(),
    bulletImpact: new Audio(),
    getStar: new Audio(),
    playerShot: new Audio(),
    bitShot: new Audio(),
    bomber: new Audio(),
    playerDeath: new Audio(),
    playerReturn: new Audio(),
    count: new Audio(),
};
// BGM
let bgms = {
    stage: new Audio(),
    boss: new Audio(),
};

let player = { // プレイヤーオブジェクト
    life: 3,
    bomb: 3,
    FC: -60,
    shotPos: [4],
    shotFire: [4],
    cooltime: 0,
    death: false,
    standby: true,
    invinsible: true
}
let playerCore;         // プレイヤーコア（当たり判定）
let playerBarrier;      // プレイヤーバリア
let playerBullets = []; // プレイヤー弾配列
let bombed;             // ボンバー

let enemy1;    // 敵1モデル
let enemy2;    // 敵2モデル
let enemyM;    // 中型敵モデル
let enemyMB;   // 中ボスモデル
let enemyBOSS; // ボスモデル
let bossAnimMixers = [];
let bossActions = new Object();
let bulletImages = []; // 敵弾画像配列
let explosionImg = []; // 爆発画像配列
let scoreStar;         // スコアアイテム画像

let enemys = [];       // エネミーsコントロール
let mediumBoss = new Object(); // 中ボス
let endBoss = new Object();  // ステージボス
let enemyBullets = []; // エネミー弾配列

let animEffects = [];  // アニメーションエフェクト配列
let stars = [];        // スコアスター配列

// 操作関連
let keyUP    = false; // 上判定
let keyLEFT  = false; // 左判定
let keyDOWN  = false; // 下判定
let keyRIGHT = false; // 右判定
let keyShot  = false; // ショット判定
let keyCShot = false; // 集中ショット判定
let keyBomb  = false; // ボンバー判定
let sKey, csKey, bKey; 

// フレームカウンタ（処理）
let frameCounter = 0;
// フレームカウンタ（全体）
let frameCounterAll = 0;
let gravity = 0.2; // 重力係数

/* TEST */
let pointSprite;

// 全体の流れ
// START ---------------------------------
(async () => {
    const promises = [
        init_three(),   // 環境の整備
        Title.Init_Title(renderer, width, hight),
        init_camera(),  // カメラ設定
        init_lights(),  // 照明設定
        init_control(), // コントローラの設定
        init_objects(), // 表示するオブジェクトの生成
        StageDataLoad()
    ]
    await Promise.all(promises);
    onWindowResize();
    loading = false;
    console.log("StartGame");
    animation(); // アニメーション(全て終わったら)
})();
if(loading) {
    LoadAnimation();
}
// END  ----------------------------------


//////ここから下は関数定義//////////
// 環境の整備
async function init_three() {
    // HTMLページからCanvas要素を取得
    const canvas  = document.createElement( 'canvas' );
    // レンダラーを作成
    const context = canvas.getContext( 'webgl2' );
    renderer = new THREE.WebGLRenderer(
       { canvas: canvas, context: context } );
    // Windowの画素とサイズに合わせる
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( width, hight );
    renderer.autoClear = false;
    // このHTMLページのDOM要素としてレンダラーを加える
    document.body.appendChild( renderer.domElement );

    // フレーム
    frameCanvas = document.getElementById( "frame" );
    frameCont = frameCanvas.getContext( '2d' );
    frameImg = new Image();
    frameImg.src = "./Assets/imgs/Frame.png";
    frameImg.onload = function() {
        onWindowResize();
    }

    // UI用キャンバス作成
    UIcanvas = document.createElement( 'canvas' );
    UIcanvas.id = "UI";
    UIcanvas.width = width;
    UIcanvas.height = hight;
    document.body.appendChild( UIcanvas );
    UIcontext = UIcanvas.getContext( '2d' );
    loadImg[0].src = "./Assets/imgs/CF_Ring.png";
    loadImg[1].src = "./Assets/imgs/CF_Frog.png";

    // Windowのリサイズの時は onWindowResizeを呼び出す
    window.addEventListener( 'resize', onWindowResize, false );
    
    // シーンを作成
    scene = new THREE.Scene();
}

// dat.gui
let GUIdata;
let GUIs = function() {
    this.ShotKey  = 'z';
    this.SpreadShotKey = 'c';
    this.BombKey  = 'x';
    this.xPos = 0;
    this.yPos = 0;
    this.zPos = 0;
}
window.onload = function() {
    GUIdata = new GUIs();
    GUIupdate();
    let gui = new GUI();
    let keyConfig = gui.addFolder('KeyConfig');
    keyConfig.add(GUIdata, 'ShotKey').onChange(GUIupdate);
    keyConfig.add(GUIdata, 'SpreadShotKey').onChange(GUIupdate);
    keyConfig.add(GUIdata, 'BombKey').onChange(GUIupdate);
    if(debugUtil) {
        let pointer = gui.addFolder('Debug');
        pointer.add(GUIdata, 'xPos', -2000, 2000, 0.01).onChange(GUIupdate);
        pointer.add(GUIdata, 'yPos', -800, 800, 0.01).onChange(GUIupdate);
        pointer.add(GUIdata, 'zPos', -2000, 2000, 0.01).onChange(GUIupdate);
    }
}
function GUIupdate() {
    sKey = GUIdata.ShotKey;
    csKey = GUIdata.SpreadShotKey;
    bKey = GUIdata.BombKey;
    if(debugUtil) {
        pointSprite.position.x = GUIdata.xPos;
        pointSprite.position.y = GUIdata.yPos;
        pointSprite.position.z = GUIdata.zPos;
    }
}

// カメラを作成
function init_camera() {
    const fov    = 60;
    const aspect = width / hight;
    const near   = 0.1;
    const far    = 30000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far );
    camera.position.set(0, 2800, 900);
    camera.rotation.set(-76 * (Math.PI/180), 0, 0);
}

// 表示するものを作ってシーンに追加する
async function init_objects() {
    function PlaneLoad() { // 自機
        return new Promise((re) => {
            const mtlLoader = new MTLLoader().load('./Assets/Plane.mtl', (mat) => {
                const materials = MtlObjBridge.addMaterialsFromMtlLoader(mat);
                
                const objLoader = new OBJLoader2();
                objLoader.addMaterials(materials);
                objLoader.load('./Assets/Plane.obj', (root) => {
                    let object = root.clone();
                    object.scale.set(60, 60, 60);
                    object.rotation.y += Math.PI;

                    playerPlane = new THREE.Object3D();
                    playerPlane.add(object);
                    playerPlane.position.set(0, 0, 2000);
                    playerPlane.rotation.set(0, 0, 1080*(Math.PI/180));

                    // プレイヤーコア
                    const coreGeo = new THREE.IcosahedronBufferGeometry(CORE_SIZE + 4);
                    const coreMat = new THREE.MeshPhongMaterial({color:'#ff0000'});
                    playerCore = new THREE.Mesh(coreGeo, coreMat);
                    playerCore.layers.set(BULLET_L);
                    playerCore.position.copy(playerPlane);
                    playerCore.position.z += 50;
                    scene.add(playerCore);

                    scene.add(playerPlane);
                    re(console.log("PlayerPlane:Completed"));
                });
            });
        });
    }

    function EffectsLoad() { // プレイヤーエフェクト
        return new Promise(async (re) => {
            await new Promise((rere) => { // ブースト
                new THREE.TextureLoader().load("./Assets/imgs/Boost.png", (botex) => {
                    botex.wrapS = THREE.RepeatWrapping;
                    botex.wrapT = THREE.RepeatWrapping;
                    botex.repeat.set(0.25, 0.5);
                    boostL = new THREE.Sprite(new THREE.SpriteMaterial({map:botex.clone()}));
                    boostL.material.map.needsUpdate = true;
                    boostL.material.map.offset.y = 0.5;
                    boostR = new THREE.Sprite(new THREE.SpriteMaterial({map:botex.clone()}));
                    boostR.material.map.needsUpdate = true;
                    boostR.material.map.offset.y = 0;

                    boostL.position.set(35, 0, 190);
                    boostL.scale.set(140, 140);
                    boostR.position.set(-35, 0, 190);
                    boostR.scale.set(140, 140);

                    playerPlane.add(boostL);
                    playerPlane.add(boostR);
                    rere(console.log("Boost:Completed"));
                });
            });

            await new Promise((rere) => { // マズルフラッシュ
                new THREE.TextureLoader().load("./Assets/imgs/MuzzleFlash.png", (mftex) => {
                    muzzleFlashMat = new THREE.SpriteMaterial({map:mftex});
                    rere(console.log("MuzzleFlash:Completed"));
                });
            })

            await new Promise((rere) => { // ヒット
                hitTex = new THREE.TextureLoader().load("./Assets/imgs/Hit.png", () => {
                    hitTex.offset.set(0, 0.5)
                    hitTex.repeat.set(0.25, 0.5);
                    rere(console.log("Hit:Completed"));
                });
            })

            await new Promise((rere) => { // ボンバー
                new THREE.TextureLoader().load("./Assets/imgs/Bomber_high_trans.png", (bombTex) => {
                    bombTex.offset.set(0, 0.8)
                    bombTex.repeat.set(0.125, 0.2);
                    bomber = new THREE.Sprite(new THREE.SpriteMaterial({map:bombTex}));
                    bomber.layers.set(EFFECT_L);
                    bomber.scale.set(4200, 4200, 4200);
                    rere(console.log("Bomber:Completed"));
                });
            })

            // バリア
            const geo = new THREE.IcosahedronBufferGeometry(240);
            const mat = new THREE.MeshLambertMaterial({color: "#00cc00", opacity: 0, transparent: true});
            playerBarrier = new THREE.Mesh(geo, mat);
            playerBarrier.active = true;
            playerBarrier.scale.set(1, 1, 1)
            scene.add(playerBarrier);

            re(console.log("Effects:Completed"))
        });
    }

    function BitLoad() { // ビット
        return new Promise((re) => {
            const mtlLoader = new MTLLoader().load('./Assets/Bit.mtl', (mat) => {
                const materials = MtlObjBridge.addMaterialsFromMtlLoader(mat);
                
                const objLoader = new OBJLoader2();
                objLoader.addMaterials(materials);
                objLoader.load('./Assets/Bit.obj', (root) => {
                    let b1 = root.clone();
                    b1.scale.set(60, 60, 60);
                    b1.rotation.y = Math.PI;
                    let b2 = b1.clone();

                    b1.rotation.z = Math.PI/2;
                    b1.position.x = 200;
                    b2.rotation.z = -Math.PI/2;
                    b2.position.x = -200;
                    b1.name = "Bit1";
                    b2.name = "Bit2";
                    
                    playerBits = new THREE.Object3D();
                    playerBits.add(b1);
                    playerBits.add(b2);

                    scene.add(playerBits);
                    re(console.log("PlayerBit:Completed"));
                });
            });
        });
    }
    
    function PBulletLoad() { // 弾
        return new Promise(async(re) => {
            await new THREE.TextureLoader().load("./Assets/imgs/PBullets_N.png", (btex) => {
                PBulletTex[0] = btex;
            });
            await new THREE.TextureLoader().load("./Assets/imgs/PBullets_B.png", (btex) => {
                PBulletTex[1] = btex;
            });
            re(console.log("PlayerBullet:Completed"));
        });
    }

    function Enemy1() { // 小型敵１モデル読み込み
        return new Promise((re) => {
            const mtlLoader = new MTLLoader().load('./Assets/Enemy1.mtl', (mat) => {
                const materials = MtlObjBridge.addMaterialsFromMtlLoader(mat);
                const objLoader = new OBJLoader2();
                objLoader.addMaterials(materials);
                objLoader.load('./Assets/Enemy1.obj', (root) => {
                    let object = root.clone();
                    object.scale.set(60, 60, 60);

                    enemy1 = new THREE.Object3D();
                    enemy1.add(object);

                    re(console.log("Enemy1:Completed"));
                });
            });
        });
    }

    function Enemy2() { // 小型敵２モデル読み込み
        return new Promise((re) => {
            const mtlLoader = new MTLLoader().load('./Assets/Enemy2.mtl', (mat) => {
                const materials = MtlObjBridge.addMaterialsFromMtlLoader(mat);
                const objLoader = new OBJLoader2();
                objLoader.addMaterials(materials);
                objLoader.load('./Assets/Enemy2.obj', (root) => {
                    let object = root.clone();
                    object.scale.set(60, 60, 60);

                    enemy2 = new THREE.Object3D();
                    enemy2.add(object);

                    re(console.log("Enemy2:Completed"));
                });
            });
        });
    }

    function EnemyM() { // 中型敵モデル読み込み
        return new Promise((re) => {
            const mtlLoader = new MTLLoader().load('./Assets/EnemyM.mtl', (mat) => {
                const materials = MtlObjBridge.addMaterialsFromMtlLoader(mat);
                const objLoader = new OBJLoader2();
                objLoader.addMaterials(materials);
                objLoader.load('./Assets/EnemyM.obj', (root) => {
                    let object = root.clone();
                    object.scale.set(90, 90, 90);
            
                    enemyM = new THREE.Object3D();
                    enemyM.add(object);
            
                    re(console.log("EnemyM:Completed"));
                });
            });
        });
    }
    
    function MidBoss() { // 中ボスモデル読み込み
        return new Promise((re) => {
            const mtlLoader = new MTLLoader().load('./Assets/Mid_Boss.mtl', (mat) => {
                const materials = MtlObjBridge.addMaterialsFromMtlLoader(mat);
                const objLoader = new OBJLoader2();
                objLoader.addMaterials(materials);
                objLoader.load('./Assets/Mid_Boss.obj', (root) => {
                    let object = root.clone();
                    object.scale.set(120, 120, 120);
            
                    enemyMB = new THREE.Object3D();
                    enemyMB.add(object);
                    enemyMB.col = {
                        bcol1: new THREE.Vector3(-250, 0, -200),
                        bcol2: new THREE.Vector3(250, 0, 250),
                        bcol3: new THREE.Vector3(200, 0, -350),
                        bcol4: new THREE.Vector3(550, 0, 300),
                        bcol5: new THREE.Vector3(-550, 0, -350),
                        bcol6: new THREE.Vector3(-200, 0, 300),
                        bcol7: new THREE.Vector3(550, 0, -300),
                        bcol8: new THREE.Vector3(1300, 0, 0),
                        bcol9: new THREE.Vector3(-1300, 0, -300),
                        bcol10: new THREE.Vector3(-550, 0, 0)
                    };
                    enemyMB.sPos = [
                        new THREE.Vector3(250, 60, 380),
                        new THREE.Vector3(-250, 60, 380),
                        new THREE.Vector3(360, 120, 90),
                        new THREE.Vector3(-360, 120, 90),
                        new THREE.Vector3(780, 80, -80),
                        new THREE.Vector3(960, 80, -160),
                        new THREE.Vector3(1120, 80, -240),
                        new THREE.Vector3(-780, 80, -80),
                        new THREE.Vector3(-960, 80, -160),
                        new THREE.Vector3(-1120, 80, -240)
                    ];
                    mediumBoss.model = enemyMB;
                    mediumBoss.HP = 1200;
                    mediumBoss.FC = 0;
                    mediumBoss.phase = 1;
                    mediumBoss.shotPos = [];
                    mediumBoss.shotItem = [];
                    mediumBoss.active = false;
            
                    re(console.log("MidBoss:Completed"));
                });
            });
        });
    }

    function StageBoss() { // ボス
        return new Promise(async(re) => {
            enemyBOSS = new THREE.Object3D();
            enemyBOSS.parts = [];
            await new FBXLoader().load("./Assets/Boss/Boss_Main_2.fbx", (boss) => {
                boss.name = "Main";
                let sp = new THREE.Object3D();
                sp.position.set(0, 1300, 0);
                boss.add(sp);
                boss.shotPos = sp;

                boss.mixer = new THREE.AnimationMixer(boss);
                bossAnimMixers[0] = boss.mixer;
                let actions = [];
                boss.animations.forEach((anim) => {
                    actions.push(boss.mixer.clipAction(anim));
                });
                actions.forEach((ac, i) => {
                    ac.setLoop(THREE.LoopOnce);
                    ac.clampWhenFinished = true;
                    if(i == 1) bossActions.mainOpen = ac;
                    if(i == 0) bossActions.mainClose = ac;
                });
                boss.scale.set(0.38, 0.38, 0.38);
                enemyBOSS.parts[0] = boss;
                enemyBOSS.add(boss);
            });
            await new FBXLoader().load("./Assets/Boss/Boss_Bit_L_2.fbx", (boss) => {
                boss.name = "Bit_L";
                let sp0 = new THREE.Object3D();
                let sp1 = new THREE.Object3D();
                let sp2 = new THREE.Object3D();
                let sp3 = new THREE.Object3D();
                let sp4 = new THREE.Object3D();
                sp0.position.set(0, 0, 1500);
                sp1.position.set(-240, 240, 1200);
                sp2.position.set(240, 240, 1200);
                sp3.position.set(-240, -240, 1200);
                sp4.position.set(240, -240, 1200);
                boss.add(sp0, sp1, sp2, sp3, sp4);
                boss.shotPos = [sp0, sp1, sp2, sp3, sp4];

                boss.mixer = new THREE.AnimationMixer(boss);
                bossAnimMixers[1] = boss.mixer;
                let actions = [];
                boss.animations.forEach((anim) => {
                    actions.push(boss.mixer.clipAction(anim));
                });
                actions.forEach((ac, i) => {
                    ac.setLoop(THREE.LoopOnce);
                    ac.clampWhenFinished = true;
                    if(i == 0) bossActions.bitLOpen = ac;
                    if(i == 1) bossActions.bitLClose = ac; 
                });
                boss.position.set(600, 0, 0);
                boss.scale.set(0.38, 0.38, 0.38);
                enemyBOSS.parts[1] = boss;
                enemyBOSS.add(boss);
            });
            await new FBXLoader().load("./Assets/Boss/Boss_Bit_R_2.fbx", (boss) => {
                boss.name = "Bit_R";
                let sp0 = new THREE.Object3D();
                let sp1 = new THREE.Object3D();
                let sp2 = new THREE.Object3D();
                let sp3 = new THREE.Object3D();
                let sp4 = new THREE.Object3D();
                sp0.position.set(0, 0, 1500);
                sp1.position.set(240, 240, 1200);
                sp2.position.set(-240, 240, 1200);
                sp3.position.set(240, -240, 1200);
                sp4.position.set(-240, -240, 1200);
                boss.add(sp0, sp1, sp2, sp3, sp4);
                boss.shotPos = [sp0, sp1, sp2, sp3, sp4];

                boss.mixer = new THREE.AnimationMixer(boss);
                bossAnimMixers[2] = boss.mixer;
                let actions = [];
                boss.animations.forEach((anim) => {
                    actions.push(boss.mixer.clipAction(anim));
                });
                actions.forEach((ac, i) => {
                    ac.setLoop(THREE.LoopOnce);
                    ac.clampWhenFinished = true;
                    if(i == 1) bossActions.bitROpen = ac;
                    if(i == 0) bossActions.bitRClose = ac; 
                });
                boss.position.set(-600, 0, 0);
                boss.scale.set(0.38, 0.38, 0.38);
                enemyBOSS.parts[2] = boss;
                enemyBOSS.add(boss);
            });
            await new FBXLoader().load("./Assets/Boss/Boss_Front_2.fbx", (boss) => {
                boss.name = "Front";
                let sp1 = new THREE.Object3D();
                let sp2 = new THREE.Object3D();
                let sp3 = new THREE.Object3D();
                let sp4 = new THREE.Object3D();
                sp1.position.set(450, 0, 4200);
                sp2.position.set(-450, 0, 4200);
                sp3.position.set(600, 300, 1750);
                sp4.position.set(-600, 300, 1750);
                boss.add(sp1, sp2, sp3, sp4);
                boss.shotPos = [sp1, sp2, sp3, sp4];

                boss.mixer = new THREE.AnimationMixer(boss);
                bossAnimMixers[3] = boss.mixer;
                let actions = [];
                boss.animations.forEach((anim) => {
                    actions.push(boss.mixer.clipAction(anim));
                });
                actions.forEach((ac, i) => {
                    ac.setLoop(THREE.LoopOnce);
                    ac.clampWhenFinished = true;
                    if(i == 1) bossActions.frontOpen = ac;
                    if(i == 0) bossActions.frontClose = ac; 
                });
                boss.scale.set(0.38, 0.38, 0.38);
                enemyBOSS.parts[3] = boss;
                enemyBOSS.add(boss);
            });
            await new FBXLoader().load("./Assets/Boss/Boss_Turret_B_2.fbx", (boss) => {
                boss.name = "Turret_B";
                let sp1 = new THREE.Object3D();
                let sp2 = new THREE.Object3D();
                let sp3 = new THREE.Object3D();
                sp1.position.set(200, 800, 760);
                sp2.position.set(0, 800, 760);
                sp3.position.set(-200, 800, 760);
                boss.add(sp1, sp2, sp3);
                boss.shotPos = [sp1, sp2, sp3];

                boss.position.set(0, 0, 600);
                boss.scale.set(0.38, 0.38, 0.38);
                enemyBOSS.parts[4] = boss;
                enemyBOSS.add(boss);
            });
            await new FBXLoader().load("./Assets/Boss/Boss_Turret_F_2.fbx", (boss) => {
                boss.name = "Turret_F";
                let sp1 = new THREE.Object3D();
                let sp2 = new THREE.Object3D();
                let sp3 = new THREE.Object3D();
                let sp4 = new THREE.Object3D();
                sp1.position.set(90, 300, 500);
                sp2.position.set(-90, 300, 500);
                sp3.position.set(220, 300, 350);
                sp4.position.set(-220, 300, 350);
                boss.add(sp1, sp2, sp3, sp4);
                boss.shotPos = [sp1, sp2, sp3, sp4];

                boss.position.set(0, 0, 1200);
                boss.scale.set(0.38, 0.38, 0.38);
                enemyBOSS.parts[5] = boss;
                enemyBOSS.add(boss);
            });
            endBoss.model = enemyBOSS;
            endBoss.phase = 1;
            endBoss.HP = 0;
            endBoss.moveItem = [];
            endBoss.shotItem = [];
            endBoss.active = false;
            endBoss.death = false;
            re(console.log("StageBoss:Completed"));
        });
    }

    function EnemyBullets() { // 敵弾画像
        return new Promise(async(re) => {
            await new THREE.TextureLoader().load('./Assets/imgs/Bullet_R.png', (tex) => {
                bulletImages[0] = tex;
            });
            await new THREE.TextureLoader().load('./Assets/imgs/Bullet_B.png', (tex) => {
                bulletImages[1] = tex;
            });
            await new THREE.TextureLoader().load('./Assets/imgs/LBullet_R.png', (tex) => {
                bulletImages[2] = tex;
            });
            await new THREE.TextureLoader().load('./Assets/imgs/LBullet_B.png', (tex) => {
                bulletImages[3] = tex;
            });
            console.log(bulletImages);
            re(console.log("EnemyBullets:Completed"));
        });
    }

    function Environment() { // 背景
        return new Promise(async(re) => {
            await new THREE.TextureLoader().load('Assets/imgs/SeamLessSky.jpg', (tex) => {
                tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(1.0, 1.0);
                const mat = new THREE.MeshBasicMaterial({map: tex});
                const geo = new THREE.PlaneBufferGeometry(4800, 4800);
                skyBG = new THREE.Mesh(geo, mat);
                skyBG.position.y = -500;
                skyBG.rotation.x = -Math.PI/2;
                skyBG.layers.set(BG_L);
                scene.add(skyBG);
            });
            await new THREE.TextureLoader().load('Assets/imgs/AreaLine.png', (tex) => {
                const mat = new THREE.MeshBasicMaterial({map: tex, transparent: true});
                const geo = new THREE.PlaneBufferGeometry(4800, 800);
                let areaLineL = new THREE.Mesh(geo, mat);
                let areaLineR = new THREE.Mesh(geo, mat);
                areaLineL.position.x = -1200;
                areaLineL.rotation.x = -90*(Math.PI/180);
                areaLineL.rotation.y = 90*(Math.PI/180);
                areaLineL.rotation.z = 90*(Math.PI/180);
                areaLineL.layers.set(BG_L);
                areaLineR.position.x = 1200;
                areaLineR.rotation.x = -90*(Math.PI/180);
                areaLineR.rotation.y = -90*(Math.PI/180);
                areaLineR.rotation.z = 90*(Math.PI/180);
                areaLineR.layers.set(BG_L);
                scene.add(areaLineL, areaLineR);
                re(console.log("Environment:Completed"));
            });
        });
    }

    function Other() { // エフェクト等
        return new Promise(async(re) => {
            await new THREE.TextureLoader().load("./Assets/imgs/Exp01.png", (expTex) => {
                expTex.offset.set(0, 0.75);
                expTex.repeat.set(0.25, 0.25);
                explosionImg[0] = expTex;
            });
            await new THREE.TextureLoader().load("./Assets/imgs/Exp02.png", (expTex) => {
                expTex.offset.set(0, 0.75);
                expTex.repeat.set(0.25, 0.25);
                explosionImg[1] = expTex;
            });
            await new THREE.TextureLoader().load("./Assets/imgs/Star.png", (scoreTex) => {
                scoreTex.offset.set(0, 0.5);
                scoreTex.repeat.set(0.25, 0.5);
                scoreStar = scoreTex;
            });
            re(console.log("Other:Completed"));
        });
    }

    function UIImages() { // UI画像
        return new Promise(async(re) => {
            comGaugeImg.src = "./Assets/imgs/ComboGauge.png";
            comFrameImg.src = "./Assets/imgs/ComboFrame.png";
            scoFrameImg.src = "./Assets/imgs/ScoreFrame.png";
            hpgaugeImg.src = "./Assets/imgs/HPGauge.png";
            hpgFrameImg.src = "./Assets/imgs/HPGaugeFrame.png";
            let digitalNumF = new FontFace("DigitalNums", "url(./Assets/DSEG7ModernMini-Regular.woff2)");
            await digitalNumF.load().then((font) => {
                document.fonts.add(font);
            });

            warning.imgs[0].src = "./Assets/imgs/WARNING_BG.png";
            warning.imgs[1].src = "./Assets/imgs/WARNING_Label.png";
            warning.imgs[2].src = "./Assets/imgs/WARNING_Text.png";
            re(console.log("UI:Completed"));
        });
    }

    async function Audios() { // サウンド
        return new Promise(async(re) => {
            sounds.bomb01.src = "./Assets/audio/bomb01.mp3";
            await sounds.bomb01.load();
            sounds.bomb02.src = "./Assets/audio/bomb02.mp3";
            await sounds.bomb02.load();
            sounds.bomb03.src = "./Assets/audio/bomb03.mp3";
            await sounds.bomb03.load();
            sounds.bomb04.src = "./Assets/audio/bomb04.mp3";
            await sounds.bomb04.load();
            sounds.bomb05.src = "./Assets/audio/bomb05.mp3";
            await sounds.bomb05.load();
            sounds.bomb06.src = "./Assets/audio/bomb06.mp3";
            await sounds.bomb06.load();
            sounds.bulletImpact.src = "./Assets/audio/bulletImpact.mp3";
            await sounds.bulletImpact.load();
            sounds.getStar.src = "./Assets/audio/getStar.mp3";
            await sounds.getStar.load();
            sounds.playerShot.src = "./Assets/audio/playerShot.mp3";
            await sounds.playerShot.load();
            sounds.bitShot.src = "./Assets/audio/bitShot.mp3";
            await sounds.bitShot.load();
            sounds.playerDeath.src = "./Assets/audio/playerDeath.mp3";
            await sounds.bomber.load();
            sounds.bomber.src = "./Assets/audio/bomber.mp3";
            await sounds.playerDeath.load();
            sounds.playerReturn.src = "./Assets/audio/playerReturn.mp3";
            await sounds.playerReturn.load();
            sounds.count.src = "./Assets/audio/count.mp3";
            await sounds.count.load();
            re(console.log("Audio:Completed"));
        });
    }

    await PlaneLoad();
    await EffectsLoad();
    await BitLoad();
    await PBulletLoad();
    await Enemy1();
    await Enemy2();
    await EnemyM();
    await MidBoss();
    await StageBoss();
    await EnemyBullets();
    await Environment();
    await Other();
    await UIImages();
    await Audios();
    console.log("ALL_ASSETS_LOADED");
    console.log(scene);
}

// 環境セット
function init_lights() {
    // 点光源をセット
    const pointLight = new THREE.PointLight(0xFFFFFF, 1, 0, 1);
    pointLight.position.set(0, 1000, -1000);
    scene.add(pointLight);
    // 環境光をセット
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    // 点光源をセット(BULLET_L)
    const bulletLight1 = new THREE.PointLight(0xFFFFFF, 1, 0, 1);
    bulletLight1.position.set(0, 0, -1000);
    bulletLight1.layers.set(BULLET_L);
    const bulletLight2 = new THREE.AmbientLight(0xFFFFFF, 0.4);
    bulletLight2.layers.set(BULLET_L);
    scene.add(bulletLight1);
    scene.add(bulletLight2);

    if(debugUtil) {
        /* 座標軸を表示 編集用 */
        const axes = new THREE.AxisHelper(120);
        scene.add(axes);
        // ポインタ
        pointSprite = new THREE.Sprite(new THREE.SpriteMaterial({color:"#00ff00"}));
        pointSprite.scale.set(40, 40);
        scene.add(pointSprite);
    }
}

// 入力コントロール
function init_control() {
    document.addEventListener( 'keydown', onDocumentKeyDown );
    document.addEventListener( 'keyup', onDocumentKeyUp );
}

// Windowのリサイズに反応する
function onWindowResize() {
    if(window.innerHeight < 820) {
        // 縦のサイズに横を合わせる
        hight = window.innerHeight - 20;
        width = hight * (7/8);
    } else {
        width = widthDef;
        hight = hightDef;
    }
    ratio = hight/hightDef;
    // Cameraのタテヨコ比を合わせる
    camera.aspect = width / hight;
    // Cameraの変換行列を更新
    camera.updateProjectionMatrix();
    // レンダラーのサイズを合わせる
    renderer.setSize( width, hight );
    // フレーム画像調整
    frameCanvas.width = 720*ratio;
    frameCanvas.height = 820*ratio;
    frameCont.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
    frameCont.drawImage(frameImg, 0, 0, frameCanvas.width, frameCanvas.height);
    // UIキャンバス更新
    UIcanvas.width = width;
    UIcanvas.height = hight;
}

// ロード画面
function LoadAnimation() {
    UIcontext.clearRect(0, 0, width, hight);
    if(loading) {
        UIcontext.fillStyle = "#080400";
        UIcontext.fillRect(0, 0, width, hight);
        UIcontext.save();
        UIcontext.translate(width/2, hight/2);
        UIcontext.rotate(loadAngle * (Math.PI/180));
        UIcontext.drawImage(loadImg[0], -128*ratio, -128*ratio, 256*ratio, 256*ratio);
        UIcontext.restore();
        UIcontext.drawImage(loadImg[1], (width/2)-128*ratio, (hight/2)-128*ratio, 256*ratio, 256*ratio);
        loadAngle += 4;
        requestAnimationFrame(LoadAnimation);
    }
}

// ステージデータ読み込み（json）
async function StageDataLoad() {
    let xml = new XMLHttpRequest();
    xml.onreadystatechange = function() {
        if(this.readyState == 4 & this.status == 200) {
            let data = JSON.parse(xml.responseText);
            let std = data.stages;
            for(let i=0; i<std.length; i++) {
                stage[i] = new Object();
                stage[i].frame = std[i].f;
                stage[i].fPos = new THREE.Vector3(std[i].xP, 0, std[i].zP);
                stage[i].type = std[i].typ;
                stage[i].danmakuP = std[i].dmk;
                stage[i].moveP = std[i].mov;
            }
            mbFrame = data.mediumBoss;
            sbFrame = data.stageBoss;

            console.log(stage);
        }
    }
    xml.open("GET", "./Stage.json");
    xml.send();
}

// レンダリング
function renderf() {
    // 背景レイヤー描画
    renderer.clear();
    camera.layers.enable(BG_L);
    camera.layers.set(BG_L);
    renderer.render( scene, camera );
    // メインレイヤー描画
    renderer.clearDepth();
    camera.layers.enable(MAIN_L);
    camera.layers.set(MAIN_L);
    renderer.render( scene, camera );
    // エフェクトレイヤー描画
    renderer.clearDepth();
    camera.layers.enable(EFFECT_L);
    camera.layers.set(EFFECT_L);
    renderer.render( scene, camera );
    // 弾レイヤー描画
    renderer.clearDepth();
    camera.layers.enable(BULLET_L);
    camera.layers.set(BULLET_L);
    renderer.render( scene, camera );
}

// 毎フレーム時に実行されるイベント
function animation() {
    // 次のフレームの呼び出しをセット
    requestAnimationFrame(animation);
    if(SceneNum == 0) {
        UIcontext.clearRect(0, 0, width, hight);
        Title.Title_Animation();
        if(keyShot) sceneMoving = true;
        if(sceneMoving) {
            if(loadOpacity < 1) {
                UIcontext.globalAlpha = loadOpacity;
                UIcontext.fillStyle = "#080404";
                UIcontext.fillRect(0, 0, width, hight);
                loadOpacity += 0.05;
            } else {
                ResetGame();
                SceneNum = 1;
                sceneMoving = false;
            }
        }
    } else if(SceneNum == 1) {
        if(!continued) {
            GameAnimation();
        } else {
            function ContinueWait() {
                if(contiCtd >= 0) {
                    UIController();
                    UIcontext.globalAlpha = 0.6;
                    UIcontext.fillStyle = "#080404";
                    UIcontext.fillRect(0, 0, width, hight);
                    UIcontext.globalAlpha = 1;
                    UIcontext.font = Math.floor(72*ratio) + "px DigitalNums";
                    UIcontext.textAlign = "center";
                    UIcontext.fillStyle = "#E0A425";
                    let num = Math.round(contiCtd / 6);
                    UIcontext.fillText(Math.floor(num/10) + "." + num%10, width/2, hight/2);
                    if(contiCtd != 0) {
                        UIcontext.font = Math.floor(40*ratio) + "px serif";
                        UIcontext.fillText("Continue?", width/2, hight/2 + 50*ratio);
                        UIcontext.font = Math.floor(24*ratio) + "px serif";
                        UIcontext.fillText("Press Shot Key", width/2, hight/2 + 80*ratio);
                        if(keyShot) {
                            continued = false;
                            player.life = 3;
                            let cc = score%10;
                            if(cc < 9) cc++;
                            score = cc;
                        }
                    }
                    if(contiCtd == 0) {
                        frameCounter = 0;
                        loadOpacity = 0;
                    }
                    if(contiCtd % 60 == 0) {
                        sounds.count.currentTime = 0;
                        sounds.count.play();
                    }
                    contiCtd--;
                } else {
                    UIcontext.clearRect(0, 0, width, hight);
                    if(loadOpacity < 1) {
                        UIcontext.globalAlpha = 0.6;
                        UIcontext.fillStyle = "#080404";
                        UIcontext.fillRect(0, 0, width, hight);
                        UIcontext.globalAlpha = 1 - loadOpacity;
                        UIcontext.font = Math.floor(72*ratio) + "px DigitalNums";
                        UIcontext.textAlign = "center";
                        UIcontext.fillStyle = "#E0A425";
                        UIcontext.fillText("0.0", width/2, hight/2);
                        loadOpacity += 0.01;
                        UIcontext.globalAlpha = loadOpacity;
                    } else {
                        UIcontext.globalAlpha = 1;
                    }
                    UIcontext.fillStyle = "#080404";
                    UIcontext.fillRect(0, 0, width, hight);
                    UIcontext.font = Math.floor(48*ratio) + "px serif";
                    UIcontext.textAlign = "center";
                    UIcontext.fillStyle = "#E0A425";
                    UIcontext.fillText("GAME OVER", width/2, hight/2);
                    frameCounter++;
                    if(frameCounter >= 500) {
                        loadOpacity = 0;
                        contiCtd = 0;
                        continued = false;
                        SceneNum = 0;
                        UIcontext.clearRect(0, 0, width, hight);
                    }
                }
            }
            ContinueWait();
        }
    }
}
async function GameAnimation() {
    // UI描画
    UIController();
    Result();

    // 擬似処理落ち
    frameCounterAll++;
    let objNums = enemyBullets.length + playerBullets.length + animEffects.length
    if(objNums >= 600) {
        if(frameCounterAll % 2 == 0) return;
    } else if(objNums >= 400) {
        if(frameCounterAll % 4 == 0) return;
    }

    // プレイヤー処理
    PlayerMove()
    if(!player.death & !player.standby) {
        if(!result.enable & !endBoss.death) {
            PlayerBomber();
            PlayerShot();
        }
    }

    // ステージ処理（敵生成）
    function StageCtrl() {
        for(stageCount; stageCount<stage.length; stageCount++) {
            let e = stage[stageCount];
            if(frameCounter == e.frame) {
                SetEnemy(e.fPos, e.type, e.danmakuP, e.moveP);
            } else if(frameCounter < e.frame) {
                break;
            }
        }

        if(frameCounter == mbFrame) {
            mediumBoss.HP = 1200;
            mediumBoss.death = false;
            mediumBoss.active = false;
            mediumBoss.FC = 0;
            mediumBoss.phase = 1;
            mediumBoss.ma = 0;
            stageMid = true;

            frameCounter++;
        }

        if(frameCounter == sbFrame) {
            endBoss.HP = 3600;
            endBoss.FC = 0;
            endBoss.phase = 0;
            endBoss.active = false;
            endBoss.death = false;
            endBoss.model.remove(endBoss.model.parts[1], endBoss.model.parts[2], endBoss.model.parts[3], endBoss.model.parts[4], endBoss.model.parts[5]);
            endBoss.model.parts[1].position.set(600, 0, 0);
            endBoss.model.parts[1].rotation.set(0, 0, 0);
            endBoss.model.parts[2].position.set(-600, 0, 0);
            endBoss.model.parts[2].rotation.set(0, 0, 0);
            endBoss.model.parts[4].rotation.set(0, 0, 0);
            endBoss.model.parts[5].rotation.set(0, 0, 0);
            endBoss.model.add(endBoss.model.parts[1], endBoss.model.parts[2], endBoss.model.parts[3], endBoss.model.parts[4], endBoss.model.parts[5]);
            for(let i=0; i<bossAnimMixers.length; i++) {
                bossAnimMixers[i].stopAllAction();
            }
            stageBoss = true;
            warning.enable = true;
            warning.FC = 1;
            frameCounter++;
        }
    }
    StageCtrl();

    // 敵処理
    EnemyCtrl();
    EnemyMove();
    EnemyDanmaku();
    if(stageMid) {
        MediumBossCtrl(); // 中ボス処理
    }
    if(stageBoss) {
        WARNING();
        if(!warning.enable) StageBossCtrl(); // ボス処理
    }
    MoveEnemyBullet();

    // プレイヤー弾処理
    PlayerBulletControll(); 
    // 当たり判定処理
    if(!bombed) {
        await PlayerBulletCol();
        await PlayerEnemyCol();
    }

    // 背景スクロール
    skyBG.material.map.offset.y += 0.005;
    if(skyBG.material.map.offset.y >= 1.0) skyBG.material.map.offset.y = 0;

    EffectCtrl(); // エフェクト処理
    StarCtrl();   // スター処理

    if((!stageMid & !stageBoss) || (stageMid & mediumBoss.active) || (stageBoss & endBoss.active)) {
        if(comboGauge > 0 & frameCounter > 0) comboGauge--;
    }
    if(comboGauge == 0) combo = 0;

    if(!stageMid & !stageBoss) frameCounter++;

    renderf(); // レンダー
}
function UIController() {
    DebugUI();
    function DebugUI() {
        if(frameCounter == 0) hpgaugeY = -60*ratio;
        UIcontext.clearRect(0, 0, width, hight);
        if(loadOpacity > 0) {
            UIcontext.globalAlpha = loadOpacity;
            UIcontext.fillStyle = "#080404";
            UIcontext.fillRect(0, 0, width, hight);
            loadOpacity -= 0.05;
        }
        UIcontext.globalAlpha = 1;
        if(stageMid) {
            if(mediumBoss.HP > 0) {
                if(hpgaugeY < 0) hpgaugeY += 2*ratio;
                else             hpgaugeY = 0;
            } else {
                if(hpgaugeY > -60*ratio) hpgaugeY -= 2*ratio;
                else                     hpgaugeY = -60*ratio;
            }
            UIcontext.drawImage(hpgFrameImg, 0, hpgaugeY, 700*ratio, 60*ratio);
            UIcontext.drawImage(hpgaugeImg, 0, hpgaugeY + (10*ratio), (700*ratio) * (mediumBoss.HP/hpGaugeMax), 30*ratio);
        } else if(stageBoss & !warning.enable) {
            if(endBoss.HP > 0) {
                if(hpgaugeY < 0) hpgaugeY += 2*ratio;
                else             hpgaugeY = 0;
            } else {
                if(hpgaugeY > -60*ratio) hpgaugeY -= 2*ratio;
                else                     hpgaugeY = -60*ratio;
            }
            UIcontext.drawImage(hpgFrameImg, 0, hpgaugeY, 700*ratio, 60*ratio);
            UIcontext.drawImage(hpgaugeImg, 0, hpgaugeY + (10*ratio), (700*ratio) * (endBoss.HP/hpGaugeMax), 30*ratio);
        } else {
            hpgaugeY = -60*ratio;
        }
        UIcontext.drawImage(scoFrameImg, 0, (60*ratio)+hpgaugeY, 250*ratio, 40*ratio);
        UIcontext.font =  Math.floor(16*ratio) + "px DigitalNums";
        UIcontext.textAlign = "right";
        UIcontext.fillStyle = "#80b080";
        UIcontext.fillText(score, 220*ratio, (88*ratio)+hpgaugeY);

        UIcontext.drawImage(comFrameImg, width-(160*ratio), (60*ratio)+hpgaugeY, 160*ratio, 80*ratio);
        UIcontext.drawImage(comGaugeImg, width-(152*ratio), (122*ratio)+hpgaugeY, (144*ratio)*(comboGauge/C_GAUGE_MAX), 12*ratio);
        UIcontext.font = Math.floor(36*ratio) + "px DigitalNums";
        UIcontext.textAlign = "center";
        UIcontext.fillStyle = "#00b000";
        UIcontext.fillText(Math.floor(combo), width-(80*ratio), (110*ratio)+hpgaugeY);


        
        UIcontext.textAlign = "center";
        UIcontext.fillStyle = "#000000";
        UIcontext.font = Math.floor(32*ratio) + "px serif";
        for(let i=1; i<player.life; i++) {
            UIcontext.fillText("L", (24*i)*ratio, (140*ratio)+hpgaugeY);
        }
        UIcontext.font = Math.floor(48*ratio) + "px serif";
        for(let i=0; i<player.bomb; i++) {
            UIcontext.fillText("B", (32*(i+1))*ratio, (-20*ratio)+hight);
        }
    }
}
function WARNING() {
    if(warning.enable) {
        enemyBullets.forEach((b) => { b.active = false; });
        UIcontext.globalAlpha = 1;
        UIcontext.fillStyle = "#ffffff";
        if(warning.FC <= 10) {
            let s = warning.FC/10;
            UIcontext.drawImage(warning.imgs[0], (-5*ratio)+width/2, (-150*ratio)*s+hight/2, (10*ratio), (300*ratio)*s);
        } else if(warning.FC <= 20) {
            let s = (warning.FC-10)/10;
            UIcontext.drawImage(warning.imgs[0], (-350*ratio)*s+width/2, (-150*ratio)+hight/2, (700*ratio)*s, (300*ratio));
        } else if(warning.FC <= 200){
            let xmove = (warning.FC-20)*14;
            if(xmove >= 800) xmove -= Math.floor(xmove/800)*800;
            UIcontext.drawImage(warning.imgs[0], -350*ratio+width/2, -150*ratio+hight/2, 700*ratio, 300*ratio);
            UIcontext.globalAlpha = 1 - (warning.FC-20)%16 * 0.025;
            UIcontext.drawImage(warning.imgs[1], (-400-xmove)*ratio+width/2, -150*ratio+hight/2, 800*ratio, 100*ratio);
            UIcontext.drawImage(warning.imgs[1], (400-xmove)*ratio+width/2, -150*ratio+hight/2, 800*ratio, 100*ratio);
            UIcontext.drawImage(warning.imgs[2], -350*ratio+width/2, -50*ratio+hight/2, 700*ratio, 100*ratio);
            UIcontext.drawImage(warning.imgs[1], (-400+xmove)*ratio+width/2, 50*ratio+hight/2, 800*ratio, 100*ratio);
            UIcontext.drawImage(warning.imgs[1], (-1200+xmove)*ratio+width/2, 50*ratio+hight/2, 800*ratio, 100*ratio);
        } else if(warning.FC <= 210){
            let s = 1-(warning.FC-200)/10;
            UIcontext.drawImage(warning.imgs[0], (-350*ratio)*s+width/2, (-150*ratio)*s+hight/2, (700*ratio)*s, (300*ratio)*s);
        }
        if(warning.FC == 230) {
            warning.enable = false;
            UIcontext.clearRect(0, 0, width, hight);
        }
        warning.FC++;
    }
}
function Result() {
    if(result.enable) {
        if(result.FC <= 60) {
            UIcontext.globalAlpha = result.FC/60;
        } else {
            UIcontext.globalAlpha = 1;
        }
        UIcontext.fillStyle = "#080404";
        UIcontext.fillRect(0, 0, width, hight);
        if(result.FC > 60) {
            if(result.FC <= 120) {
                UIcontext.globalAlpha = (result.FC-60)/60;
                UIcontext.font = Math.floor(48*ratio) + "px serif";
                UIcontext.textAlign = "center";
                UIcontext.fillStyle = "#E0A425";
                UIcontext.fillText("MISSION COMPLETE", width/2, hight/2);
            } else if(result.FC <= 150) {
                UIcontext.globalAlpha = 1;
                UIcontext.font = Math.floor(48*ratio) + "px serif";
                UIcontext.textAlign = "center";
                UIcontext.fillStyle = "#E0A425";
                UIcontext.fillText("MISSION COMPLETE", width/2, hight/2);
                UIcontext.globalAlpha = (result.FC-120)/30;
                UIcontext.textAlign = "center";
                UIcontext.fillStyle = "#E0A425";
                UIcontext.font = Math.floor(32*ratio) + "px serif";
                UIcontext.fillText("[Score]", width/2, hight/2+(60*ratio));
                UIcontext.font = Math.floor(32*ratio) + "px digitalNums";
                UIcontext.fillText(score, width/2, hight/2+(100*ratio));
            } else {
                UIcontext.globalAlpha = 1;
                UIcontext.font = Math.floor(48*ratio) + "px serif";
                UIcontext.textAlign = "center";
                UIcontext.fillStyle = "#E0A425";
                UIcontext.fillText("MISSION COMPLETE", width/2, hight/2);
                UIcontext.textAlign = "center";
                UIcontext.fillStyle = "#E0A425";
                UIcontext.font = Math.floor(32*ratio) + "px serif";
                UIcontext.fillText("[Score]", width/2, hight/2+(60*ratio));
                UIcontext.font = Math.floor(32*ratio) + "px digitalNums";
                UIcontext.fillText(score, width/2, hight/2+(100*ratio));
            }
            if(result.FC > 400 & result.FC <= 460) {
                UIcontext.globalAlpha = (result.FC-400)/60;
                UIcontext.fillStyle = "#080404";
                UIcontext.fillRect(0, 0, width, hight);
                if(result.FC == 460) {
                    result.enable = false;
                    SceneNum = 0;
                    UIcontext.clearRect(0, 0, width, hight);
                }
            }
        }
        result.FC++;
    }
}
function ResetGame() {
    frameCounterAll = 0;
    frameCounter = 0;
    score = 0;
    combo = 0;
    comboGauge = 0;

    player.life = 3;
    player.bomb = 3;
    player.FC = -60;
    player.cooltime = 0;
    player.death = false;
    player.standby = true;
    player.invinsible = true;
    playerBarrier.enable = true;
    playerPlane.position.set(0, 0, 2000);
    playerPlane.rotation.set(0, 0, 1080*(Math.PI/180));
    scene.add(playerBarrier);
    playerBullets.forEach((pb) => { scene.remove(pb); });
    playerBullets = [];
    bombed = false;
    
    enemys.forEach((e) => { scene.remove(e.model); });
    enemys = [];
    enemyBullets.forEach((eb) => { scene.remove(eb.spr); });
    enemyBullets = [];
    animEffects.forEach((ae) => { scene.remove(ae); });
    animEffects = [];
    stars.forEach((ss) => { scene.remove(ss); });
    stars = [];

    if(stageMid) scene.remove(mediumBoss.model);
    if(stageBoss) scene.remove(endBoss.model);
    for(let i=0; i<bossAnimMixers.length; i++) {
        bossAnimMixers[i].stopAllAction();
    }
    mediumBoss.active = false;
    endBoss.active = false;
    stageMid = false;
    stageBoss = false;
    stageCount = 0;
    hpgaugeY = -60*ratio;
    warning.enable = false;
    warning.FC = 0;
}


// プレイヤー制御
function PlayerMove() {
    if(!player.standby & !player.death) {
        let coe = 1.0; // 斜め移動係数
        let move = 24;  // 移動量
        let role = 0;  // 傾き
        if(keyShot) move = 16;

        if(keyUP) { // 上
            if(keyLEFT ^ keyRIGHT) coe = 0.71;
            if(playerPlane.position.z > -1200)
                playerPlane.position.z -= move * coe;
        }
        if(keyDOWN) { // 下
            if(keyLEFT ^ keyRIGHT) coe = 0.71;
            if(playerPlane.position.z < 1500)
                playerPlane.position.z += move * coe;
        }
        if(keyLEFT) { // 左
            if(keyUP ^ keyDOWN) coe = 0.71;
            if(playerPlane.position.x > -1000)
                playerPlane.position.x -= move * coe;
            role += 27; // 左に傾く
        }
        if(keyRIGHT) { // 右
            if(keyUP ^ keyDOWN) coe = 0.71;
            if(playerPlane.position.x < 1000)
                playerPlane.position.x += move * coe;
            role -= 27; // 右に傾く
        }

        if(keyLEFT & keyRIGHT) role = 0; // 平行

        if(playerPlane.rotation.z > role * (Math.PI/180)) {
            playerPlane.rotation.z -= 1.5 * (Math.PI/180);
        } else if(playerPlane.rotation.z < role * (Math.PI/180)) {
            playerPlane.rotation.z += 1.5 * (Math.PI/180);
        }
    }
    // 撃墜処理
    if(player.death) {
        if(player.FC == 0) {
            player.bomb = 3;
            player.death = false;
            player.standby = true;
            playerPlane.position.set(0, 0, 2000);
            playerPlane.rotation.set(0, 0, 1080*(Math.PI/180));
            scene.add(playerPlane, playerBits, playerCore, playerBarrier);
        } else {
            player.FC--;
        }
    }
    if(player.standby) {
        if(player.life == 0) {
            continued = true;
            contiCtd = 600;
        } else {
            if(playerPlane.position.z == 2000) {
                sounds.playerReturn.currentTime = 0;
                sounds.playerReturn.play();
            }
            if(playerPlane.position.z <= 1000) {
                playerPlane.position.z = 1000;
                player.standby = false;
                player.FC += 120;
            } else {
                let addz = (1000 - playerPlane.position.z) * 0.05;
                if(addz > -5) addz = -5;
                playerPlane.position.z += addz;
                if(playerPlane.rotation.z > 0) {
                    addz = (0 - playerPlane.rotation.z) * 0.06;
                    if(addz > -4*(Math.PI/180)) addz = -4*(Math.PI/180);
                    playerPlane.rotation.z += addz;
                } else {
                    playerPlane.rotation.z = 0;
                }
            }
        }
    }

    // プレイヤーコア更新
    playerCore.position.copy(playerPlane.position);
    playerCore.position.z += 50;
    playerCore.rotation.x += 6 * (Math.PI/180);
    playerCore.rotation.y += 10 * (Math.PI/180);

    // ビット更新
    let bPos;
    if(keyShot) {
        bPos = 100;
        playerBits.children[0].rotation.y = 180 * (Math.PI/180);
        playerBits.children[1].rotation.y = 0 * (Math.PI/180);
    } else {
        bPos = 200;
        playerBits.children[0].rotation.y = (180-15) * (Math.PI/180);
        playerBits.children[1].rotation.y = -15 * (Math.PI/180);
    } 
    if(playerBits.children[0].position.x < bPos) {
        playerBits.children[0].position.x += 10;
        playerBits.children[1].position.x -= 10;
    } else if(playerBits.children[0].position.x > bPos) {
        playerBits.children[0].position.x -= 10;
        playerBits.children[1].position.x += 10;
    }
    playerBits.position.x = playerPlane.position.x;
    playerBits.position.z = playerPlane.position.z - 160;
    playerBits.rotation.z += 0.06;

    player.shotPos[0] = new THREE.Vector3(playerPlane.position.x + 45, 0, playerPlane.position.z - 40);
    player.shotPos[1] = new THREE.Vector3(playerPlane.position.x - 45, 0, playerPlane.position.z - 40);
    player.shotPos[2] = new THREE.Vector3().setFromMatrixPosition(playerBits.children[0].matrixWorld);
    player.shotPos[3] = new THREE.Vector3().setFromMatrixPosition(playerBits.children[1].matrixWorld);

    // ブーストエフェクト更新
    if(!player.bfc) player.bfc = 0;
    if(player.bfc % 3 == 0 && player.bfc != 0) {
        boostL.material.map.offset.x += 0.25;
        boostR.material.map.offset.x += 0.25;
        if(player.bfc % 12 == 0) {
            boostL.material.map.offset.y -= 0.5;
            boostR.material.map.offset.y -= 0.5;
        }
    }
    player.bfc++;

    // バリア更新
    if(player.invinsible) {
        playerBarrier.active = true;
        if(!player.death & !player.standby & !bombed) {
            if(player.FC == 0) player.invinsible = false;
            else player.FC--;
        }
        if(playerBarrier.material.opacity < 0.5)
            playerBarrier.material.opacity += 0.05;
    } else {
        if(playerBarrier.material.opacity > 0) {
            playerBarrier.material.opacity -= 0.05;
        } else if(playerBarrier.active) {
            scene.remove(playerBarrier);
            playerBarrier.active = false;
        }
    }
    if(playerBarrier.active) {
        playerBarrier.position.copy(playerPlane.position);
        playerBarrier.rotation.z -= 0.2;
    }
}
// プレイヤーショット
function PlayerShot() { 
    if(player.cooltime == 0) {
        if((keyCShot || keyShot) && !bombed) {
            for(let i=0; i<player.shotPos.length; i++) {
                // ショット生成
                let shot;
                if(i < 2) {
                    shot = new THREE.Sprite(new THREE.SpriteMaterial({map: PBulletTex[0].clone()}));
                    shot.material.map.needsUpdate = true;
                    shot.xmove = 0;
                    shot.zmove = -80;
                    sounds.playerShot.currentTime = 0;
                    sounds.playerShot.play();
                } else if(i >= 2) {
                    if(!keyShot) {
                        const dist = player.shotPos[i].x - playerPlane.position.x;
                        if(dist <= 120 && dist >= -120) {
                            break;
                        } else {
                            shot = new THREE.Sprite(new THREE.SpriteMaterial({map: PBulletTex[1].clone()}));
                            shot.material.map.needsUpdate = true;
                            if(dist > 0) {
                                shot.xmove = 80 * Math.cos(-75 * (Math.PI/180));
                                shot.zmove = 80 * Math.sin(-75 * (Math.PI/180));
                            } else {
                                shot.xmove = 80 * Math.cos(-105 * (Math.PI/180));
                                shot.zmove = 80 * Math.sin(-105 * (Math.PI/180));
                            }
                            sounds.bitShot.currentTime = 0;                        
                            sounds.bitShot.play();
                        }
                    } else {
                        shot = new THREE.Sprite(new THREE.SpriteMaterial({map: PBulletTex[1].clone()}));
                        shot.material.map.needsUpdate = true;
                        shot.xmove = 80 * Math.cos(-90 * (Math.PI/180));
                        shot.zmove = 80 * Math.sin(-90 * (Math.PI/180));
                        sounds.bitShot.currentTime = 0;                        
                        sounds.bitShot.play();                            
                    }
                }
                shot.scale.set(140, 140);
                shot.position.copy(ResetBPos(player.shotPos[i]));
                shot.layers.set(BULLET_L);
                shot.FC = 0;
                shot.active = true;
                playerBullets.push(shot);
                scene.add(shot);
                
                // マズルフラッシュ生成
                let mf = new THREE.Sprite(muzzleFlashMat);
                mf.scale.set(150, 150);
                mf.position.copy(player.shotPos[i]);
                mf.position.z -= 100;
                player.shotFire.push(mf);
                scene.add(mf);
            };

            player.cooltime = 4;
        }
    } else {
        // マズルフラッシュ消去
        if(player.cooltime == 2) {
            player.shotFire.forEach( function(ele, i) {
                scene.remove(ele);
                player.shotFire.splice(i, 0);
            });
        }
        player.cooltime--;
    }
}
// プレイヤー弾処理
function PlayerBulletControll() {
    playerBullets.forEach( function(bullet, i) {
        bullet.FC++;
        let power = 1, sp = 10;
        if(bullet.FC <= 3) {
            bullet.material.color.set("#ff8888");
            power = 2;
            sp = 30;
        } else if(bullet.FC <= 6) {
            bullet.material.color.set("#ffbbbb");
            power = 1.5;
            sp = 20;
        } else if(bullet.FC == 7) {
            bullet.material.color.set("#ffffff");
        }
        bullet.position.x += bullet.xmove;
        bullet.position.z += bullet.zmove;
        // 範囲外 非アクティブ
        if(bullet.position.x < -1700 || bullet.position.x > 1700 || bullet.position.z < -1800 || bullet.position.z > 1800) {
            bullet.active = false;
        } else if(bullet.active) {
            // 当たり判定処理
            for(let i=0; i<enemys.length; i++) {
                if(!enemys[i].death) {
                    if(CircleCollider(bullet.position, enemys[i].model.position, 60, enemys[i].cr)) {
                        score += sp;
                        // エネミーダメージ
                        if(enemys[i].active) {
                            enemys[i].HP -= power;
                            if(enemys[i].type == 3) {
                                combo += 0.05 * power;
                                if(comboGauge < C_GAUGE_MAX) comboGauge += 3;
                            }
                        }
                        // ヒットエフェクト生成
                        let hitE = AnimSpriteSet(hitTex, bullet.position, 2, 300);
                        hitE.type = 0;
                        animEffects.push(hitE);
                        scene.add(hitE);

                        sounds.bulletImpact.currentTime = 0;
                        sounds.bulletImpact.play();

                        bullet.active = false; // 弾丸非アクティブ
                        break;
                    }
                }
            }
            if(bullet.active) {
                // 中ボスヒット判定
                if(stageMid & mediumBoss.active) {
                    let bp1 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol1);
                    let bp2 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol2);
                    let bp3 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol3);
                    let bp4 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol4);
                    let bp5 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol5);
                    let bp6 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol6);
                    let bp7 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol7);
                    let bp8 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol8);
                    let bp9 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol9);
                    let bp10 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol10);
                    if(CBCollider(bullet.position, 60, bp1, bp2)
                    || CBCollider(bullet.position, 60, bp3, bp4)
                    || CBCollider(bullet.position, 60, bp5, bp6)
                    || CBCollider(bullet.position, 60, bp7, bp8)
                    || CBCollider(bullet.position, 60, bp9, bp10)) {
                        score += sp;
                        mediumBoss.HP -= power;
                        combo += 0.05 * power;
                        if(comboGauge < C_GAUGE_MAX) comboGauge += 3;
                        // ヒットエフェクト生成
                        let hitE = AnimSpriteSet(hitTex, bullet.position, 2, 300);
                        hitE.type = 0;
                        animEffects.push(hitE);
                        scene.add(hitE);
                        
                        sounds.bulletImpact.currentTime = 0;
                        sounds.bulletImpact.play();

                        bullet.active = false; // 弾丸非アクティブ
                    }
                }
                // ボスヒット判定
                if(stageBoss & endBoss.active) {
                    let main = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[0].matrixWorld)
                    let lbit1 = new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].matrixWorld), new THREE.Vector3(-250, 0, -400));
                    let lbit2 = new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].matrixWorld), new THREE.Vector3(250, 0, 450));
                    let rbit1 = new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].matrixWorld), new THREE.Vector3(-250, 0, -400));
                    let rbit2 = new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].matrixWorld), new THREE.Vector3(250, 0, 450));
                    if(endBoss.phase < 10) {
                        let front1 = new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].matrixWorld), new THREE.Vector3(-100, 0, 400));
                        let front2 = new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].matrixWorld), new THREE.Vector3(100, 0, 1600));
                        if(CircleCollider(bullet.position, main, 60, 400)
                        || CBCollider(bullet.position, 60, lbit1, lbit2)
                        || CBCollider(bullet.position, 60, rbit1, rbit2)
                        || CBCollider(bullet.position, 60, front1, front2)) {
                            score += sp;
                            endBoss.HP -= power;
                            combo += 0.05 * power;
                            if(comboGauge < C_GAUGE_MAX) comboGauge += 3;
                            // ヒットエフェクト生成
                            let hitE = AnimSpriteSet(hitTex, bullet.position, 2, 300);
                            hitE.type = 0;
                            animEffects.push(hitE);
                            scene.add(hitE);
                        
                            sounds.bulletImpact.currentTime = 0;
                            sounds.bulletImpact.play();

                            bullet.active = false; // 弾丸非アクティブ
                        }
                    } else if(endBoss.phase < 20) {
                        let lbit = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].matrixWorld);
                        let rbit = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].matrixWorld);
                        if(CircleCollider(bullet.position, main, 60, 400)) {
                            score += sp;
                            endBoss.HP -= power;
                            combo += 0.05 * power;
                            if(comboGauge < C_GAUGE_MAX) comboGauge += 3;
                            // ヒットエフェクト生成
                            let hitE = AnimSpriteSet(hitTex, bullet.position, 2, 300);
                            hitE.type = 0;
                            animEffects.push(hitE);
                            scene.add(hitE);
                        
                            sounds.bulletImpact.currentTime = 0;
                            sounds.bulletImpact.play();

                            bullet.active = false; // 弾丸非アクティブ
                        } else if(CircleCollider(bullet.position, lbit, 60, 260) || CircleCollider(bullet.position, rbit, 60, 260)) {
                            score += sp;
                            endBoss.bitHP -= power;
                            combo += 0.05 * power;
                            if(comboGauge < C_GAUGE_MAX) comboGauge += 3;
                            // ヒットエフェクト生成
                            let hitE = AnimSpriteSet(hitTex, bullet.position, 2, 300);
                            hitE.type = 0;
                            animEffects.push(hitE);
                            scene.add(hitE);
                        
                            sounds.bulletImpact.currentTime = 0;
                            sounds.bulletImpact.play();

                            bullet.active = false; // 弾丸非アクティブ
                        }
                    } else {
                        if(CircleCollider(bullet.position, main, 60, 400)) {
                            score += sp;
                            endBoss.HP -= power;
                            combo += 0.05 * power;
                            if(comboGauge < C_GAUGE_MAX) comboGauge += 3;
                            // ヒットエフェクト生成
                            let hitE = AnimSpriteSet(hitTex, bullet.position, 2, 300);
                            hitE.type = 0;
                            animEffects.push(hitE);
                            scene.add(hitE);
                        
                            sounds.bulletImpact.currentTime = 0;
                            sounds.bulletImpact.play();

                            bullet.active = false; // 弾丸非アクティブ
                        } 
                    }
                }
            }
        }
    });

    // 非アクティブ弾全消去
    playerBullets.forEach( function(bullet, i) {
        if(!bullet.active) {
            scene.remove(bullet);
            playerBullets.splice(i, 1);
        }
    });
}
// ボンバー処理
function PlayerBomber() {
    if(!bombed) {
        if(keyBomb & player.bomb > 0) {
            bomber.position.copy(playerPlane.position);
            bomber.position.z -= 500;
            bomber.material.map.offset.set(0, 0.8);
            bomber.material.map.FC = 0;
            scene.add(bomber);

            sounds.bomber.currentTime = 0;
            sounds.bomber.play();

            bombed = true;
            player.invinsible = true;
            player.bomb--;
            scene.add(playerBarrier);
            // 現存スター非アクティブ
            stars.forEach((ss) => {
                ss.active = false;
            });
            // 敵弾をスターに
            enemyBullets.forEach((eb) => {
                StarSet(eb.spr.position, 150, 100);
            });
            console.log("Bomber!!");
        }
    }
    if(bombed) {
        if(bomber.material.map.FC <= 140) {
            enemys.forEach((enemy) => {
                if(enemy.active) enemy.HP -= 2;
            });
            if(mediumBoss.active) {
                mediumBoss.HP -= 2;
            }
            if(endBoss.active) {
                endBoss.HP -=2;
                if(endBoss.phase > 10 & endBoss.phase < 20) {
                    endBoss.bitHP -= 2;
                }
            }
        }
        bomber.position.z -= 4;
        if(SpriteAnimation(bomber.material.map, 8, 5, 4)) {
            scene.remove(bomber);
            bombed = false;
            player.invinsible = false;
            console.log("Bomber_End");
        }
    }
}

// エネミー生成
function SetEnemy(position, type, danmaku, move) {
    let e = new Object();
    e.type = type;
    switch(type) {
        case 1:
            e.model = enemy1.clone();
            e.model.position.copy(position);
            e.shotPos = [new THREE.Object3D()];
            e.shotPos[0].position.set(0, 0, 180);
            e.model.add(e.shotPos[0]);
            e.HP = 2;
            e.cr = 100;
            e.scoreP = 100;
            break;
        case 2:
            e.model = enemy2.clone();
            e.model.position.copy(position);
            e.shotPos = [new THREE.Object3D(), new THREE.Object3D()]
            e.shotPos[0].position.set(75, 0, 180);
            e.model.add(e.shotPos[0]);
            e.shotPos[1].position.set(-75, 0, 180);
            e.model.add(e.shotPos[1]);
            e.HP = 3;
            e.cr = 80;
            e.scoreP = 150;
            break;
        case 3:
            e.model = enemyM.clone();
            e.model.position.copy(position);
            e.shotPos = [new THREE.Object3D(), new THREE.Object3D()]
            e.shotPos[0].position.set(215, 90, 80);
            e.model.add(e.shotPos[0]);
            e.shotPos[1].position.set(-215, 90, 80);
            e.model.add(e.shotPos[1]);
            e.HP = 70;
            e.cr = 200;
            e.scoreP = 500;
            break;
    }
    e.firstPosition = position;
    e.danmakuPatern = danmaku;
    e.movePatern = move;
    e.FC = 1;
    e.active = false;
    e.returning = false;
    scene.add(e.model);
    enemys.push(e);
    console.log(enemys);
}
// エネミー処理
function EnemyCtrl() {
    enemys.forEach(function(enemy, i) {
        if(enemy.HP <= 0 && !enemy.death) {
            if(!bombed) {
                combo++;
                comboGauge = C_GAUGE_MAX;
            }
            score += enemy.scoreP * (Math.floor(combo)+1);
            enemy.death = true;
            enemy.FC = 0;
            if(enemy.type == 3) {
                enemy.expPos = [
                    new THREE.Vector3(80, 0, -100),
                    new THREE.Vector3(-160, 0, 200),
                    new THREE.Vector3(180, 0, 220),
                    new THREE.Vector3(-140, 0, -90)
                ]
            }
        }
        if(enemy.death) {
            // スコアスター生成
            if(!bombed && enemy.FC == 0) {
                switch(enemy.type) {
                    case 1:
                    case 2:
                        StarSet(enemy.model.position, 160, 200);
                        break;
                    case 3:
                        StarSet(enemy.model.position, 300, 500);
                        break;
                }
            }
            // 爆発エフェクト生成
            switch(enemy.type) {
                case 1:
                case 2:
                    let exp = AnimSpriteSet(explosionImg[0], enemy.model.position, 2, enemy.cr*5);
                    exp.type = 1;
                    animEffects.push(exp);
                    scene.add(exp);
                    sounds.bomb01.currentTime = 0;
                    sounds.bomb01.play();
                    enemy.active = false;
                    break;
                case 3:
                    if(enemy.FC == 32) {
                        let exp = AnimSpriteSet(explosionImg[0], enemy.model.position, 2, enemy.cr*6);
                        exp.type = 2;
                        animEffects.push(exp);
                        scene.add(exp);
                        sounds.bomb02.currentTime = 0;
                        sounds.bomb02.play();
                        enemy.active = false;
                    } else if(enemy.FC % 8 == 0) {
                        let exp = AnimSpriteSet(explosionImg[(enemy.FC/8)%2], enemy.expPos[enemy.FC/8].add(enemy.model.position), 2, 500);
                        exp.type = 1;
                        animEffects.push(exp);
                        scene.add(exp);
                        sounds.bomb01.currentTime = 0;
                        sounds.bomb01.play();
                    }
                    enemy.FC++;
                    break;
            }
        }
        if((!enemy.active & enemy.death) || (!enemy.active & enemy.returning)) {
            scene.remove(enemy.model);
            enemys.splice(i, 1);
        }
    });
}
// エネミー移動
function EnemyMove() {
    enemys.forEach((enemy) => {
        if(!enemy.death) {
            switch(enemy.movePatern) {
                case 1: // 下に降りる
                    if(!enemy.velocity) enemy.velocity = 20;
                    enemy.velocity += (4 - enemy.velocity) * 0.02;
                    enemy.model.position.z += enemy.velocity;
                    break;
                case 2: // 下に降りる、待機、上に帰る
                    if(enemy.FC <= 240) {
                        if(!enemy.velocity) enemy.velocity = 60;
                        enemy.velocity += -enemy.velocity * 0.04;
                        enemy.model.position.z += enemy.velocity;
                    } else {
                        enemy.velocity += (60 - enemy.velocity) * 0.04;
                        enemy.model.position.z -= enemy.velocity;
                    }
                    break;
                case 3: // 下に降りる、待機、左下に帰る
                    if(enemy.FC <= 200) {
                        if(!enemy.velocity) enemy.velocity = 60;
                        enemy.velocity += -enemy.velocity * 0.04;
                        enemy.model.position.z += enemy.velocity;
                    } else {
                        enemy.velocity += (30 - enemy.velocity) * 0.04;
                        enemy.model.position.x += enemy.velocity * Math.cos(-40 * (Math.PI/180));
                        enemy.model.position.z -= enemy.velocity * Math.sin(-40 * (Math.PI/180));
                    }
                    break;
                case 4: // 下に降りる、待機、右下に帰る
                    if(enemy.FC <= 200) {
                        if(!enemy.velocity) enemy.velocity = 60;
                        enemy.velocity += -enemy.velocity * 0.04;
                        enemy.model.position.z += enemy.velocity;
                    } else {
                        enemy.velocity += (30 - enemy.velocity) * 0.04;
                        enemy.model.position.x += enemy.velocity * Math.cos(-140 * (Math.PI/180));
                        enemy.model.position.z -= enemy.velocity * Math.sin(-140 * (Math.PI/180));
                    }
                    break;
                case 5: // 下に降りる、左に帰る
                    if(enemy.FC <= 100) {
                        if(!enemy.velocity) enemy.velocity = 10;
                        enemy.model.position.z += enemy.velocity;
                    } else {
                        enemy.velocity += (30 - enemy.velocity) * 0.02;
                        enemy.model.position.x -= enemy.velocity * Math.cos(-30 * (Math.PI/180));
                        enemy.model.position.z -= enemy.velocity * Math.sin(-30 * (Math.PI/180));
                        enemy.model.rotation.z += 0.04;
                    }
                    break;
                case 6: // 下に降りる、右に帰る
                    if(enemy.FC <= 100) {
                        if(!enemy.velocity) enemy.velocity = 10;
                        enemy.model.position.z += enemy.velocity;
                    } else {
                        enemy.velocity += (30 - enemy.velocity) * 0.02;
                        enemy.model.position.x -= enemy.velocity * Math.cos(-150 * (Math.PI/180));
                        enemy.model.position.z -= enemy.velocity * Math.sin(-150 * (Math.PI/180));
                        enemy.model.rotation.z -= 0.04;
                    }
                    break;
                case 7: // 上から右に曲線を描いて
                    if(!enemy.velocity) enemy.velocity = 10;
                    if(!enemy.moveAngle) enemy.moveAngle = -90;
                    enemy.velocity += (20 - enemy.velocity) * 0.02;
                    if(enemy.moveAngle > -160 & enemy.FC >= 40) enemy.moveAngle -= 0.4;
                    enemy.model.position.x -= enemy.velocity * Math.cos(enemy.moveAngle * (Math.PI/180));
                    enemy.model.position.z -= enemy.velocity * Math.sin(enemy.moveAngle * (Math.PI/180));
                    break;
                case 8: // 上から左に曲線を描いて
                    if(!enemy.velocity) enemy.velocity = 10;
                    if(!enemy.moveAngle) enemy.moveAngle = -90;
                    enemy.velocity += (20 - enemy.velocity) * 0.02;
                    if(enemy.moveAngle < -20 & enemy.FC >= 40) enemy.moveAngle += 0.4;
                    enemy.model.position.x -= enemy.velocity * Math.cos(enemy.moveAngle * (Math.PI/180));
                    enemy.model.position.z -= enemy.velocity * Math.sin(enemy.moveAngle * (Math.PI/180));
                    break;
            }
            // 画面内外判定
            const pos = new THREE.Vector3().copy(enemy.model.position)
            const ep = pos.project(camera);
            if (ep.x <= 1.0 & ep.x >= -1.0 & ep.y <= 1.0 & ep.y >= -1.0) {
                enemy.active = true;
                enemy.returning = true;
            } else {
                enemy.active = false;
            }
            // 画面下部では撃たない
            if(enemy.model.position.z >= 1000) enemy.nonShot = true;
        }
    });
}
// エネミー弾幕
function EnemyDanmaku() {
    enemys.forEach((enemy) => {
        if(!enemy.death && enemy.active && !enemy.nonShot) {
            switch(enemy.type) {
                case 1:
                    Type1Danmaku(enemy);
                    break;
                case 2:
                    Type2Danmaku(enemy);
                    break;
                case 3:
                    Type3Danmaku(enemy);
                    break;
                default:
                    enemy.FC++;
                    break;
            }
        }
    });

    /* タイプ別弾幕処理 */
    function Type1Danmaku(e) {
        let angle;
        if(player.death) angle = 90;
        else             angle = LookPlayer(e.model.position);
        e.model.rotation.y = (-angle+90) * (Math.PI/180);
        switch(e.danmakuPatern) {
            case 1:
                if(e.FC % 120 == 0) {
                    let pos = new THREE.Vector3().setFromMatrixPosition(e.shotPos[0].matrixWorld);
                    SetEnemyBullet(pos, 0, 25, angle, 80);
                }
                break;
            case 2:
                if(e.FC % 80 == 0) {
                    let pos = new THREE.Vector3().setFromMatrixPosition(e.shotPos[0].matrixWorld);
                    SetEnemyBullet(pos, 0, 25, angle, 80);
                }
                break;
        }
        e.FC++;
    }
    function Type2Danmaku(e) {
        switch(e.danmakuPatern) {
            case 1:
                if(e.FC % 80 == 0) {
                    let pos = [
                        new THREE.Vector3().setFromMatrixPosition(e.shotPos[0].matrixWorld),
                        new THREE.Vector3().setFromMatrixPosition(e.shotPos[1].matrixWorld)
                    ];
                    SetEnemyBullet(pos[0], 3, 20, 90, 200);
                    SetEnemyBullet(pos[1], 3, 20, 90, 200);
                }
                break;
            case 2:
                let angle;
                if(player.death) angle = 90;
                else             angle = LookPlayer(e.model.position);
                e.model.rotation.y = (-angle+90) * (Math.PI/180);
                if(e.FC % 80 == 0) {
                    let pos = [
                        new THREE.Vector3().setFromMatrixPosition(e.shotPos[0].matrixWorld),
                        new THREE.Vector3().setFromMatrixPosition(e.shotPos[1].matrixWorld)
                    ];
                    SetEnemyBullet(pos[0], 3, 20, angle, 200);
                    SetEnemyBullet(pos[1], 3, 20, angle, 200);
                }
                break;
        }
        e.FC++;
    }
    function Type3Danmaku(e) {
        switch(e.danmakuPatern) {
            case 1:
                if(e.FC % 300 == 60) {
                    for(let i=0; i<5; i++) {
                        let angle = 120 - (15*i);
                        let bx = e.cr * Math.cos(angle * (Math.PI/180)) + e.model.position.x;
                        let bz = e.cr * Math.sin(angle * (Math.PI/180)) + e.model.position.z;
                        let pos = new THREE.Vector3(bx, 0, bz);
                        SetEnemyBullet(pos, 1, 12, angle, 120);
                    }
                }
                if(e.FC % 300 == 80) {
                    for(let i=0; i<10; i++) {
                        let angle = 126 - (8*i);
                        let bx = e.cr/2 * Math.cos(angle * (Math.PI/180)) + e.model.position.x;
                        let bz = e.cr/2 * Math.sin(angle * (Math.PI/180)) + e.model.position.z;
                        let pos = new THREE.Vector3(bx, 0, bz);
                        SetEnemyBullet(pos, 1, 24, angle, 100);
                    }
                }
                if(e.FC >= 150 & (e.FC % 150 == 0 || e.FC % 150 == 10 || e.FC % 150 == 20)) {
                    let pos = [
                        new THREE.Vector3().setFromMatrixPosition(e.shotPos[0].matrixWorld),
                        new THREE.Vector3().setFromMatrixPosition(e.shotPos[1].matrixWorld)
                    ];
                    SetEnemyBullet(pos[0], 2, 24, 90, 200);
                    SetEnemyBullet(pos[1], 2, 24, 90, 200);
                }
                break;
        }
        e.FC++;
    }
}

// 中ボス処理
function MediumBossCtrl() {
    if(!mediumBoss.active) {
        if(!mediumBoss.death) {
            if(mediumBoss.FC == 0) {
                hpGaugeMax = mediumBoss.HP;
                mediumBoss.model.position.set(8000, 0, -600);
                mediumBoss.model.rotation.set(0, 0, -1440*(Math.PI/180));
                scene.add(mediumBoss.model);
                mediumBoss.FC++;
            }
            mediumBoss.model.position.x += (0 - mediumBoss.model.position.x) * 0.06;
            mediumBoss.model.rotation.z += (0 - mediumBoss.model.rotation.z) * 0.08;
            if(Math.floor(mediumBoss.model.position.x) == 0) {
                mediumBoss.model.position.x = 0;
                mediumBoss.active = true;
            }
        } else { // 撃破演出
            if(mediumBoss.FC == 0) {
                enemyBullets.forEach((eb) => {
                    StarSet(eb.spr.position, 150, 200);
                    eb.active = false;
                });
                mediumBoss.expPoses = [];
                let mpos = mediumBoss.model.position;
                mediumBoss.expPoses[0] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(0, 0, 0));
                mediumBoss.expPoses[1] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(400, 0, 200));
                mediumBoss.expPoses[2] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(-650, 0, -340));
                mediumBoss.expPoses[3] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(1000, 0, -120));
                mediumBoss.expPoses[4] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(-900, 0, 180));
                mediumBoss.expPoses[5] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(560, 0, 300));
                mediumBoss.expPoses[6] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(1200, 0, -80));
                mediumBoss.expPoses[7] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(80, 0, 70));
                mediumBoss.expPoses[8] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(-600, 0, 300));
                mediumBoss.expPoses[9] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(400, 0, -200));
            } else if(mediumBoss.FC%8 == 0 & mediumBoss.FC/8 < mediumBoss.expPoses.length*2+1) {
                let suf = mediumBoss.FC/8 - 1;
                if(suf >= mediumBoss.expPoses.length) suf -= mediumBoss.expPoses.length;
                let exp = AnimSpriteSet(explosionImg[0], mediumBoss.expPoses[suf], 2, 1100);
                exp.type = 1;
                animEffects.push(exp);
                scene.add(exp);

                if(mediumBoss.FC%80 == 32 || mediumBoss.FC%80 == 56) {
                    sounds.bomb04.currentTime = 0;
                    sounds.bomb04.play();
                } else {
                    sounds.bomb03.currentTime = 0;
                    sounds.bomb03.play();
                }
            }
            if(mediumBoss.FC == 180) {
                mediumBoss.expPoses = [];
                let mpos = mediumBoss.model.position;
                mediumBoss.expPoses[0] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(0, 0, 0));
                mediumBoss.expPoses[1] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(440, 0, 100));
                mediumBoss.expPoses[2] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(-480, 0, -140));
                mediumBoss.expPoses[3] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(860, 0, -240));
                mediumBoss.expPoses[4] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(-720, 0, -180));
                mediumBoss.expPoses[5] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(1040, 0, 260));
                mediumBoss.expPoses[6] = new THREE.Vector3().addVectors(mpos, new THREE.Vector3(-1120, 0, 300));

                let exp1 = AnimSpriteSet(explosionImg[0], mediumBoss.model.position, 5, 3000);
                exp1.type = 2;
                animEffects.push(exp1);
                scene.add(exp1);
                mediumBoss.expPoses.forEach(function(pos, i) {
                    let exp = AnimSpriteSet(explosionImg[i%2], pos, 4, 1400);
                    exp.type = 2;
                    animEffects.push(exp);
                    scene.add(exp);
                    if(i == 0) StarSet(pos, 1000, 150);
                    else       StarSet(pos, 600, 80);
                });

                sounds.bomb05.currentTime = 0;
                sounds.bomb05.play();

                score += 200000 + (10000 * Math.floor(combo));
                scene.remove(mediumBoss.model);
                stageMid = false;
            }
            Effect();
            mediumBoss.model.position.z += 2;
            mediumBoss.FC++;
        }
    } else {
        function Moving() {
            if(mediumBoss.phase == 1) {
                if(mediumBoss.FC <= 630) {
                    if(!mediumBoss.ma) mediumBoss.ma = 0;
                    mediumBoss.ma += 1*(Math.PI/180);
                    mediumBoss.model.position.x = -Math.sin(mediumBoss.ma) * 200;
                } else {
                    mediumBoss.model.position.x += (0 - mediumBoss.model.position.x) * 0.03;
                    let addz = (500 - mediumBoss.model.position.z) * 0.02;
                    if(addz < 2) addz = 2;
                    mediumBoss.model.position.z += addz;
                    if(Math.floor(mediumBoss.model.position.z) == 500) {
                        mediumBoss.model.position.x = 0;
                        mediumBoss.model.position.z = 500;
                        mediumBoss.FC = 1;
                        mediumBoss.phase = 2;
                        mediumBoss.ma = 0;
                    }
                }
            } else if(mediumBoss.phase == 2) {
                if(mediumBoss.model.position.z > -800 & mediumBoss.FC <= 360) {
                    mediumBoss.model.position.z -= 4;
                    if(mediumBoss.FC <= 270) {
                        mediumBoss.ma += 2*(Math.PI/180);
                        mediumBoss.model.position.x = -Math.sin(mediumBoss.ma) * 60;
                    }
                } else if(mediumBoss.FC > 360) {
                    if(mediumBoss.model.position.z <= -600) {
                        mediumBoss.model.position.z += 2;
                    } else {
                        mediumBoss.model.position.z = -600;
                        mediumBoss.FC = 1;
                        mediumBoss.phase = 1;
                        mediumBoss.ma = 0;
                    }
                }
            }

            for(let i=0; i<mediumBoss.model.sPos.length; i++) {
                mediumBoss.shotPos[i] = new THREE.Vector3().addVectors(mediumBoss.model.position, mediumBoss.model.sPos[i]);
            }
        }
        function Danmaku() {
            if(mediumBoss.phase == 1) {
                if(mediumBoss.FC <= 630 ) {
                    if(mediumBoss.FC == 1) {
                        mediumBoss.shotItem[0] = 180 * Math.random();
                        mediumBoss.shotItem[1] = mediumBoss.shotItem[0] + 24;
                    }
                    if(mediumBoss.FC % 26 == 10 || mediumBoss.FC % 26 == 14 || mediumBoss.FC % 26 == 18) {
                        SetEnemyBullet(mediumBoss.shotPos[2], 0, 20, mediumBoss.shotItem[0], 80);
                        SetEnemyBullet(mediumBoss.shotPos[2], 0, 20, mediumBoss.shotItem[0]+6, 80);
                        SetEnemyBullet(mediumBoss.shotPos[2], 0, 20, mediumBoss.shotItem[0]+12, 80);
                        SetEnemyBullet(mediumBoss.shotPos[2], 0, 20, mediumBoss.shotItem[0]+180, 80);
                        SetEnemyBullet(mediumBoss.shotPos[2], 0, 20, mediumBoss.shotItem[0]+186, 80);
                        SetEnemyBullet(mediumBoss.shotPos[2], 0, 20, mediumBoss.shotItem[0]+192, 80);
                    }
                    if(mediumBoss.FC % 10 == 0) {
                        SetEnemyBullet(mediumBoss.shotPos[3], 0, 20, -mediumBoss.shotItem[1], 80);
                        SetEnemyBullet(mediumBoss.shotPos[3], 0, 20, -mediumBoss.shotItem[1]+120, 80);
                        SetEnemyBullet(mediumBoss.shotPos[3], 0, 20, -mediumBoss.shotItem[1]-120, 80);
                    }
                    if(mediumBoss.FC >= 160 & mediumBoss.FC % 4 == 0 & mediumBoss.FC % 160 < 12) {
                        let s = 20 + (6 * (mediumBoss.FC % 160 / 6));
                        const angle1 = LookPlayer(mediumBoss.shotPos[5]);
                        const angle2 = LookPlayer(mediumBoss.shotPos[8]);
                        SetEnemyBullet(mediumBoss.shotPos[4], 3, s, angle1, 250);
                        SetEnemyBullet(mediumBoss.shotPos[5], 3, s, angle1, 250);
                        SetEnemyBullet(mediumBoss.shotPos[6], 3, s, angle1, 250);
                        SetEnemyBullet(mediumBoss.shotPos[7], 3, s, angle2, 250);
                        SetEnemyBullet(mediumBoss.shotPos[8], 3, s, angle2, 250);
                        SetEnemyBullet(mediumBoss.shotPos[9], 3, s, angle2, 250);
                    }
                    mediumBoss.shotItem[0] += 1.6;
                    mediumBoss.shotItem[1] += 1.6;
                }
            } else if(mediumBoss.phase == 2) {
                if(mediumBoss.FC <= 320) {
                    SetEnemyBullet(mediumBoss.shotPos[0], 0, Math.random()*(30-10)+20, Math.random()*(105-75)+75, 60);
                    SetEnemyBullet(mediumBoss.shotPos[1], 0, Math.random()*(30-10)+20, Math.random()*(105-75)+75, 60);
                    if(mediumBoss.FC >= 60) {
                        if(mediumBoss.FC % 30 == 0) {
                            SetEnemyBullet(mediumBoss.shotPos[4], 3, 30, 90, 250);
                            SetEnemyBullet(mediumBoss.shotPos[5], 3, 30, 90, 250);
                            SetEnemyBullet(mediumBoss.shotPos[6], 3, 30, 90, 250);
                            SetEnemyBullet(mediumBoss.shotPos[7], 3, 30, 90, 250);
                            SetEnemyBullet(mediumBoss.shotPos[8], 3, 30, 90, 250);
                            SetEnemyBullet(mediumBoss.shotPos[9], 3, 30, 90, 250);
                        } else if(mediumBoss.FC % 30 == 10) {
                            SetEnemyBullet(mediumBoss.shotPos[4], 3, 30, 110, 250);
                            SetEnemyBullet(mediumBoss.shotPos[5], 3, 30, 110, 250);
                            SetEnemyBullet(mediumBoss.shotPos[6], 3, 30, 110, 250);
                            SetEnemyBullet(mediumBoss.shotPos[7], 3, 30, 70, 250);
                            SetEnemyBullet(mediumBoss.shotPos[8], 3, 30, 70, 250);
                            SetEnemyBullet(mediumBoss.shotPos[9], 3, 30, 70, 250);
                        } else if(mediumBoss.FC % 30 == 20) {
                            SetEnemyBullet(mediumBoss.shotPos[4], 3, 30, 70, 250);
                            SetEnemyBullet(mediumBoss.shotPos[5], 3, 30, 70, 250);
                            SetEnemyBullet(mediumBoss.shotPos[6], 3, 30, 70, 250);
                            SetEnemyBullet(mediumBoss.shotPos[7], 3, 30, 110, 250);
                            SetEnemyBullet(mediumBoss.shotPos[8], 3, 30, 110, 250);
                            SetEnemyBullet(mediumBoss.shotPos[9], 3, 30, 110, 250);
                        }
                    }
                }
                if(mediumBoss.FC == 340) {
                    let angle = LookPlayer(mediumBoss.shotPos[2]);
                    for(let i=0; i<16; i++) {
                        SetEnemyBullet(mediumBoss.shotPos[2], 1, 20, angle + (22.5*i) - 11.25, 120);
                    }
                }
                if(mediumBoss.FC == 350) {
                    let angle = LookPlayer(mediumBoss.shotPos[3]);
                    for(let i=0; i<16; i++) {
                        SetEnemyBullet(mediumBoss.shotPos[3], 1, 20, angle + (22.5*i) - 11.25, 120);
                    }
                }
            }
        }
        Moving();
        Danmaku();
        Effect();
        mediumBoss.FC++;
        if(mediumBoss.HP <= 0) {
            mediumBoss.HP = 0;
            mediumBoss.active = false;
            mediumBoss.death = true;
            mediumBoss.FC = 0; 
        }
    }

    function Effect() {
        if(mediumBoss.HP <= hpGaugeMax*(2/3)) {
            if(mediumBoss.FC % 5 == 0) {
                let ePos = new THREE.Vector3().addVectors(mediumBoss.model.position, new THREE.Vector3(360, 0, -320));
                let exp = AnimSpriteSet(explosionImg[0], ePos, 3, 360);
                exp.type = 2;
                animEffects.push(exp);
                scene.add(exp);
            }
        }
        if(mediumBoss.HP <= hpGaugeMax/3) {
            if(mediumBoss.FC % 5 == 2) {
                let ePos = new THREE.Vector3().addVectors(mediumBoss.model.position, new THREE.Vector3(-560, 0, 0));
                let exp = AnimSpriteSet(explosionImg[1], ePos, 3, 320);
                exp.type = 2;
                animEffects.push(exp);
                scene.add(exp);
            }
        }
    }
}

// ボス処理
function StageBossCtrl() {
    if(!endBoss.active) {
        if(!endBoss.death) {
            if(endBoss.phase == 0) {
                if(endBoss.FC == 0) {
                    hpGaugeMax = endBoss.HP;
                    endBoss.model.position.set(0, -4000, 6000);
                    endBoss.model.rotation.set(0, Math.PI, 0);
                    scene.add(endBoss.model);
                } else {
                    let addy = (0 - endBoss.model.position.y) * 0.035;
                    if(addy < 4) addy = 4;
                    if(endBoss.model.position.y < 0) endBoss.model.position.y += addy;
                    else                             endBoss.model.position.y = 0;
                    let addz = (-1000 - endBoss.model.position.z) * 0.04;
                    if(addz > -4) addz = -4;
                    if(endBoss.model.position.z > -1000) endBoss.model.position.z += addz;
                    else                                 endBoss.model.position.z = -1000;
                    let addr = (0 - endBoss.model.rotation.y) * 0.05;
                    if(addr > -0.001) addr = -0.001;
                    if(endBoss.model.rotation.y > 0) endBoss.model.rotation.y += addr;
                    else                             endBoss.model.rotation.y = 0;

                    if(endBoss.model.position.y == 0 & endBoss.model.position.z == -1000 & endBoss.model.rotation.y == 0) {
                        endBoss.FC = 1;
                        endBoss.phase = 1;
                        endBoss.active = true;
                    }
                 }
                 endBoss.FC++;
            } else if(endBoss.phase == 10) {
                if(endBoss.FC <= 30) {
                    if(endBoss.FC == 0) {
                        endBoss.moveItem[0] = endBoss.model.position.z - 400;
                    }
                    endBoss.model.position.z += (endBoss.moveItem[0]-endBoss.model.position.z)*0.07;
                } else if(endBoss.FC <= 120) {
                    if(endBoss.FC == 31) {
                        endBoss.moveItem[0] = endBoss.model.position.x;
                        endBoss.moveItem[1] = endBoss.model.position.z;
                    }
                    let t = endBoss.FC - 30;
                    endBoss.model.position.x = (1 - t/90)*endBoss.moveItem[0];
                    endBoss.model.position.z = (1 - t/90)*endBoss.moveItem[1] - (t/90)*600;
                } else {
                    let addx = (1000-endBoss.model.parts[1].position.x)*0.04;
                    if(addx < 4) addx = 4;
                    endBoss.model.parts[1].position.x += addx;
                    endBoss.model.parts[2].position.x -= addx;
                    if(endBoss.model.parts[1].position.x >= 1000) {
                        endBoss.model.parts[1].position.x = 1000;
                        endBoss.model.parts[2].position.x = -1000;
                        endBoss.moveItem = [];
                        endBoss.FC = 1;
                        endBoss.phase = 11;
                        endBoss.active = true;
                    }
                    if(endBoss.FC == 130) {
                        bossActions.mainOpen.play();
                    }
                }
                endBoss.FC++;
            }
        } else {
            if(endBoss.FC <= 260) {
                endBoss.model.position.y -= 1.5;
                endBoss.model.position.z += 2.5;
                if(endBoss.FC % 5 == 0) {
                    let exp = AnimSpriteSet(explosionImg[0], new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(250, 400, 200)), 3, 400);
                    exp.type = 2;
                    animEffects.push(exp);
                    scene.add(exp);
                }
                if(endBoss.FC % 5 == 3) {
                    let exp = AnimSpriteSet(explosionImg[1], new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(-160, 400, -200)), 3, 300);
                    exp.type = 2;
                    animEffects.push(exp);
                    scene.add(exp);
                }
                if(endBoss.FC > 60 & endBoss.FC <= 240) {
                    let expPoses = [
                        new THREE.Vector3(340, 400, -180),
                        new THREE.Vector3(-200, 380, 320),
                        new THREE.Vector3(-130, 400, 130),
                        new THREE.Vector3(190, 360, -180),
                        new THREE.Vector3(270, 350, 160),
                        new THREE.Vector3(-320, 370, -250),
                        new THREE.Vector3(80, 400, -80),
                        new THREE.Vector3(0, 370, -350),
                        new THREE.Vector3(-400, 370, 0),
                    ];
                    if(endBoss.FC%8 == 0) {
                        let num = endBoss.FC % 72 / 8;
                        let exp = AnimSpriteSet(explosionImg[num%2], new THREE.Vector3().addVectors(endBoss.model.position, expPoses[num]), 2, 1200+(num%3)*-100+100);
                        exp.type = 1;
                        animEffects.push(exp);
                        scene.add(exp);

                        if((endBoss.FC-60)%72 == 40 || (endBoss.FC-60)%72 == 70) {
                            sounds.bomb04.currentTime = 0;
                            sounds.bomb04.play();
                        } else {
                            sounds.bomb03.currentTime = 0;
                            sounds.bomb03.play();
                        }
                    }
                } 
                if(endBoss.FC == 260) {
                    let expPoses = [
                        new THREE.Vector3(540, 400, -280),
                        new THREE.Vector3(-300, 380, 420),
                        new THREE.Vector3(-380, 400, 330),
                        new THREE.Vector3(290, 360, -280),
                        new THREE.Vector3(370, 350, 260),
                        new THREE.Vector3(-280, 370, -350),
                        new THREE.Vector3(-440, 400, -260),
                        new THREE.Vector3(0, 370, 450),
                    ];
                    for(let i=0; i<expPoses.length; i++) {
                        let exp = AnimSpriteSet(explosionImg[i%2], new THREE.Vector3().addVectors(endBoss.model.position, expPoses[i]), 3, 1600);
                        exp.type = 1;
                        animEffects.push(exp);
                        scene.add(exp);
                    }
                    let exp = AnimSpriteSet(explosionImg[1], new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(0, 200, 0)), 4, 3600);
                    exp.type = 1;
                    animEffects.push(exp);
                    scene.add(exp);

                    sounds.bomb06.currentTime = 0;
                    sounds.bomb06.play();

                    scene.remove(endBoss.model);
                }
            }
            if(endBoss.FC == 550) {
                stageBoss = false;
                result.enable = true;
                result.FC = 1;
            }
            endBoss.FC++;
        }
    } else {
        function Moving() {
            switch(endBoss.phase) {
                case 1:
                    if(!endBoss.moveItem[0] || endBoss.FC == 1) {
                        endBoss.moveItem[0] = 0;
                        endBoss.moveItem[1] = 0;
                    }
                    if(endBoss.FC <= 600) {
                        endBoss.moveItem[0] += 0.9;
                        endBoss.model.position.x = Math.sin(endBoss.moveItem[0]*(Math.PI/180)) * 300;
                        endBoss.moveItem[1] += 1.8;
                        endBoss.model.position.z = Math.sin(endBoss.moveItem[1]*(Math.PI/180)) * 100 - 1000;
                    }
                    if(endBoss.FC > 600 & endBoss.FC <= 700) {
                        endBoss.moveItem[1] += 0.9;
                        endBoss.model.position.z = Math.sin(endBoss.moveItem[1]*(Math.PI/180)) * 400 - 1000;
                    }
                    if(endBoss.FC == 700) {
                        endBoss.model.position.set(0, 0, -600);
                        endBoss.FC = 0;
                        endBoss.phase = 2;
                        endBoss.moveItem = [];
                    }
                    break;
                case 3:
                    if(!endBoss.moveItem[0] || endBoss.FC == 1) endBoss.moveItem[0] = 0; 
                    if(endBoss.FC <= 120) {
                        let addx = (-1500 - endBoss.model.position.x) * 0.03;
                        if(addx > -4) addx = -4;
                        if(endBoss.model.position.x < -1500) endBoss.model.position.x = -1500;
                        else                                 endBoss.model.position.x += addx;
                        endBoss.model.position.z += -1300/120;
                    } else if(endBoss.FC <= 360) {
                        endBoss.model.position.x += 3000/240;
                        endBoss.moveItem[0] += 180/240;
                        endBoss.model.position.z = Math.sin(endBoss.moveItem[0]*(Math.PI/180))*-200 - 1900;
                    } else if(endBoss.FC <= 480) {
                        if(endBoss.FC == 361) endBoss.moveItem[0] = 0;
                        endBoss.moveItem[0] += 90/120;
                        endBoss.model.position.x = Math.cos(endBoss.moveItem[0]*(Math.PI/180))*1500;
                        endBoss.model.position.z = Math.cos(endBoss.moveItem[0]*(Math.PI/180))*-900 - 1000;
                    }
                    break;
                
                case 11:
                    if(!endBoss.moveItem[0]) {
                        endBoss.moveItem[0] = 0;
                        endBoss.moveItem[1] = 0;
                    }
                    if(endBoss.FC <= 660) {
                        endBoss.moveItem[0] += 3;
                        endBoss.model.position.y = Math.sin(endBoss.moveItem[0]*(Math.PI/180)) * 50;
                    }
                    if(endBoss.FC <= 540) {
                        endBoss.moveItem[1] += 2;
                        endBoss.model.parts[1].position.z = Math.sin(endBoss.moveItem[1]*(Math.PI/180)) * 60;
                        endBoss.model.parts[2].position.z = -Math.sin(endBoss.moveItem[1]*(Math.PI/180)) * 60;
                    }
                    break;
                case 12:
                    if(!endBoss.moveItem[0]) {
                        endBoss.moveItem[0] = 0;
                        endBoss.moveItem[1] = 0;
                        endBoss.moveItem[2] = 0;
                    }
                    if(endBoss.FC <= 60) {
                        endBoss.model.parts[1].position.x = (1 - endBoss.FC/60)*1000 + (endBoss.FC/60)*600;
                        endBoss.model.parts[1].rotation.y = (-(endBoss.FC/60)*-90) * (Math.PI/180);
                        endBoss.model.parts[2].position.x = (1 - endBoss.FC/60)*-1000 + (endBoss.FC/60)*-600;
                        endBoss.model.parts[2].rotation.y = (-(endBoss.FC/60)*90) * (Math.PI/180);
                    } else if(endBoss.FC <= 960) {
                        endBoss.moveItem[1] += 0.4 * (Math.PI/180);
                        endBoss.moveItem[2] += Math.sin(endBoss.moveItem[1]) * 8*(Math.PI/180);
                        endBoss.model.parts[1].position.x = Math.cos(endBoss.moveItem[2])*600;
                        endBoss.model.parts[1].position.z = Math.sin(endBoss.moveItem[2])*600;
                        endBoss.model.parts[1].rotation.y = -endBoss.moveItem[2] + Math.PI/2;
                        endBoss.model.parts[2].position.x = Math.cos(endBoss.moveItem[2]-Math.PI)*600;
                        endBoss.model.parts[2].position.z = Math.sin(endBoss.moveItem[2]-Math.PI)*600;
                        endBoss.model.parts[2].rotation.y = -endBoss.moveItem[2] - Math.PI/2;

                        endBoss.model.position.x = Math.sin(endBoss.moveItem[1]*2)*600;
                        endBoss.model.position.z = Math.sin(endBoss.moveItem[1]*4)*140 - 600;
                    } else if(endBoss.FC <= 1020) {
                        let t  = endBoss.FC - 960;
                        endBoss.model.parts[1].position.x = (1 - t/60)*600 + (t/60)*1000;
                        endBoss.model.parts[1].rotation.y = ((1 - t/60)*90) * (Math.PI/180);
                        endBoss.model.parts[2].position.x = (1 - t/60)*-600 + (t/60)*-1000;
                        endBoss.model.parts[2].rotation.y = ((1 - t/60)*-90) * (Math.PI/180);
                    }
                    if(endBoss.FC <= 1020) {
                        endBoss.moveItem[0] += 3;
                        endBoss.model.position.y = Math.sin(endBoss.moveItem[0]*(Math.PI/180)) * 50;
                    }
                    break;
                
                case 21:
                    if(!endBoss.moveItem[0]) {
                        endBoss.moveItem[0] = 0;
                        endBoss.moveItem[1] = endBoss.model.position.x;
                        endBoss.moveItem[2] = endBoss.model.position.y;
                        endBoss.moveItem[3] = endBoss.model.position.z;
                    }
                    if(endBoss.FC <= 120) {
                        endBoss.model.position.x = (1 - endBoss.FC/120)*endBoss.moveItem[1];
                        endBoss.model.position.y = (1 - endBoss.FC/120)*endBoss.moveItem[2];
                        endBoss.model.position.z = (1 - endBoss.FC/120)*endBoss.moveItem[3] - (endBoss.FC/120)*600;
                    } else {
                        endBoss.moveItem[0] += 3;
                        endBoss.model.position.y = Math.sin(endBoss.moveItem[0]*(Math.PI/180)) * 50;
                    }
                    break;
            }
        }
        function Danmaku() {
            switch(endBoss.phase) {
                case 1:
                    let angle1 = LookPlayer(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].matrixWorld)) - 90;
                    if(angle1 >= -90) {
                        if(angle1 > 90)       angle1 = 90;
                        else if(angle1 < -90) angle1 = -90;
                    } else {
                        if(angle1 >= -180)     angle1 = -90;
                        else if(angle1 < -180) angle1 = 90;
                    }
                    if(endBoss.FC >= 600) angle1 = 0;
                    let dis = endBoss.model.parts[4].rotation.y*(180/Math.PI) + angle1;
                    if(dis >= 0) {
                        if(Math.abs(dis) > 2) endBoss.model.parts[4].rotation.y -= 2*(Math.PI/180);
                        else                  endBoss.model.parts[4].rotation.y = -angle1*(Math.PI/180);
                    } else {
                        if(Math.abs(dis) > 2) endBoss.model.parts[4].rotation.y += 2*(Math.PI/180);
                        else                  endBoss.model.parts[4].rotation.y = -angle1*(Math.PI/180);
                    }

                    let angle2 = LookPlayer(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[4].matrixWorld)) - 90;
                    if(angle2 >= -90) {
                        if(angle2 > 90)       angle2 = 90;
                        else if(angle2 < -90) angle2 = -90;
                    } else {
                        if(angle2 >= -180)     angle2 = -90;
                        else if(angle2 < -180) angle2 = 90;
                    }
                    if(endBoss.FC >= 600) angle2 = 0;
                    dis = endBoss.model.parts[5].rotation.y*(180/Math.PI) + angle2;
                    if(dis >= 0) {
                        if(Math.abs(dis) > 2) endBoss.model.parts[5].rotation.y -= 2*(Math.PI/180);
                        else                  endBoss.model.parts[5].rotation.y = -angle2*(Math.PI/180);
                    } else {
                        if(Math.abs(dis) > 2) endBoss.model.parts[5].rotation.y += 2*(Math.PI/180);
                        else                  endBoss.model.parts[5].rotation.y = -angle2*(Math.PI/180);
                    }


                    if(endBoss.FC < 600) {
                        if(endBoss.FC % 300 == 100 || endBoss.FC % 300 == 150 || endBoss.FC % 300 == 200) {
                            let fta = -endBoss.model.parts[5].rotation.y * (180/Math.PI) + 90;
                            let shotPs1 = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[5].shotPos[2].matrixWorld);
                            let shotPs2 = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[5].shotPos[3].matrixWorld);
                            SetEnemyBullet(shotPs1, 0, 12, fta, 80);
                            SetEnemyBullet(shotPs1, 0, 12, fta-12, 80);
                            SetEnemyBullet(shotPs1, 0, 12, fta-24, 80);
                            SetEnemyBullet(shotPs2, 0, 12, fta, 80);
                            SetEnemyBullet(shotPs2, 0, 12, fta+12, 80);
                            SetEnemyBullet(shotPs2, 0, 12, fta+24, 80);
                            if(endBoss.FC == 500) {
                                SetEnemyBullet(shotPs1, 0, 12, fta-36, 80);
                                SetEnemyBullet(shotPs2, 0, 12, fta+36, 80);
                            }
                        }
                        if(endBoss.FC % 150 == 0) {
                            let fta = -endBoss.model.parts[5].rotation.y * (180/Math.PI) + 90;
                            let shotPs1 = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[5].shotPos[0].matrixWorld);
                            let shotPs2 = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[5].shotPos[1].matrixWorld);
                            SetEnemyBullet(shotPs1, 0, 16, fta, 120);
                            SetEnemyBullet(shotPs2, 0, 16, fta, 120);
                        }
                        if(endBoss.FC % 150 <= 12 & endBoss.FC >= 150) {
                            let fta = -endBoss.model.parts[4].rotation.y * (180/Math.PI) + 90;
                            let shotPs = [];
                            for(let i=0; i<endBoss.model.parts[4].shotPos.length; i++) {
                                shotPs[i] = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[4].shotPos[i].matrixWorld);
                            }
                            if(endBoss.FC % 150 == 0) {
                                SetEnemyBullet(shotPs[0], 1, 16, fta-10, 80);
                                SetEnemyBullet(shotPs[1], 1, 16, fta, 80);
                                SetEnemyBullet(shotPs[2], 1, 16, fta+10, 80);
                            }
                            if(endBoss.FC % 150 == 4) {
                                SetEnemyBullet(shotPs[0], 1, 18, fta-10, 80);
                                SetEnemyBullet(shotPs[1], 1, 18, fta, 80);
                                SetEnemyBullet(shotPs[2], 1, 18, fta+10, 80);
                            }
                            if(endBoss.FC % 150 == 8) {
                                SetEnemyBullet(shotPs[0], 1, 20, fta-10, 80);
                                SetEnemyBullet(shotPs[1], 1, 20, fta, 80);
                                SetEnemyBullet(shotPs[2], 1, 20, fta+10, 80);
                            }
                            if(endBoss.FC % 150 == 12) {
                                SetEnemyBullet(shotPs[0], 1, 22, fta-10, 80);
                                SetEnemyBullet(shotPs[1], 1, 22, fta, 80);
                                SetEnemyBullet(shotPs[2], 1, 22, fta+10, 80);
                            }
                        }
                    } else {
                        if(endBoss.FC == 630 || endBoss.FC == 670) {
                            let shotPs = [];
                            for(let i=0; i<endBoss.model.parts[5].shotPos.length; i++) {
                                shotPs[i] = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[5].shotPos[i].matrixWorld);
                            }
                            SetEnemyBullet(shotPs[0], 0, 15, 90, 80);
                            SetEnemyBullet(shotPs[1], 0, 15, 90, 80);
                            SetEnemyBullet(shotPs[2], 0, 15, 90, 80);
                            SetEnemyBullet(shotPs[2], 0, 15, 70, 80);
                            SetEnemyBullet(shotPs[2], 0, 15, 50, 80);
                            SetEnemyBullet(shotPs[3], 0, 15, 90, 80);
                            SetEnemyBullet(shotPs[3], 0, 15, 110, 80);
                            SetEnemyBullet(shotPs[3], 0, 15, 130, 80);
                        }
                        if(endBoss.FC == 650) {
                            let shotPs = [];
                            for(let i=0; i<endBoss.model.parts[5].shotPos.length; i++) {
                                shotPs[i] = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[5].shotPos[i].matrixWorld);
                            }
                            SetEnemyBullet(shotPs[0], 0, 15, 90, 80);
                            SetEnemyBullet(shotPs[1], 0, 15, 90, 80);
                            SetEnemyBullet(shotPs[2], 0, 15, 90, 80);
                            SetEnemyBullet(shotPs[2], 0, 15, 80, 80);
                            SetEnemyBullet(shotPs[2], 0, 15, 70, 80);
                            SetEnemyBullet(shotPs[2], 0, 15, 60, 80);
                            SetEnemyBullet(shotPs[2], 0, 15, 50, 80);
                            SetEnemyBullet(shotPs[3], 0, 15, 90, 80);
                            SetEnemyBullet(shotPs[3], 0, 15, 100, 80);
                            SetEnemyBullet(shotPs[3], 0, 15, 110, 80);
                            SetEnemyBullet(shotPs[3], 0, 15, 120, 80);
                            SetEnemyBullet(shotPs[3], 0, 15, 130, 80);
                        }
                        if(endBoss.FC % 600 == 40 || endBoss.FC % 600 == 50 || endBoss.FC % 600 == 60) {
                            let shotPs = [];
                            for(let i=0; i<endBoss.model.parts[4].shotPos.length; i++) {
                                shotPs[i] = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[4].shotPos[i].matrixWorld);
                            }
                            SetEnemyBullet(shotPs[0], 1, 18, 80, 80);
                            SetEnemyBullet(shotPs[0], 1, 18, 65, 80);
                            SetEnemyBullet(shotPs[0], 1, 18, 95, 80);
                            SetEnemyBullet(shotPs[1], 1, 18, 90, 80);
                            SetEnemyBullet(shotPs[1], 1, 18, 80, 80);
                            SetEnemyBullet(shotPs[1], 1, 18, 100, 80);
                            SetEnemyBullet(shotPs[2], 1, 18, 100, 80);
                            SetEnemyBullet(shotPs[2], 1, 18, 85, 80);
                            SetEnemyBullet(shotPs[2], 1, 18, 115, 80);
                        }
                    }
                    if(endBoss.FC <= 640 & endBoss.FC % 20 == 0) {
                        let shotPsL = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].shotPos[0].matrixWorld);
                        let shotPsR = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].shotPos[0].matrixWorld);
                        SetEnemyBullet(shotPsL, 3, 24, 84, 250);
                        SetEnemyBullet(shotPsR, 3, 24, 96, 250);
                    }
                    break;
                case 2:
                    if(endBoss.FC == 30) {
                        bossActions.mainClose.stop();
                        bossActions.mainOpen.play();
                    }
                    if(endBoss.FC > 60) {
                        let center = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[0].shotPos.matrixWorld);
                        if(!endBoss.shotItem[0] || endBoss.FC == 61) {
                            endBoss.shotItem[0] = LookPlayer(center);
                        }
                        if(endBoss.FC % 5 == 0 & endBoss.FC <= 110) {
                            for(let i=0; i<20; i++) {
                                let angle = 18*i + endBoss.shotItem[0];
                                let pos = new THREE.Vector3().addVectors(new THREE.Vector3(Math.cos(angle*(Math.PI/180))*400, 0, Math.sin(angle*(Math.PI/180))*400), center)
                                SetEnemyBullet(pos, 0, 20, angle-20, 80);
                            }
                            endBoss.shotItem[0] -= 2;
                        } else if(endBoss.FC % 8 == 0 & endBoss.FC <= 230 & endBoss.FC > 150) {
                            for(let i=0; i<20; i++) {
                                let angle = 18*i + endBoss.shotItem[0];
                                let pos = new THREE.Vector3().addVectors(new THREE.Vector3(Math.cos(angle*(Math.PI/180))*400, 0, Math.sin(angle*(Math.PI/180))*400), center)
                                SetEnemyBullet(pos, 0, 22, angle+20, 80);
                            }
                            endBoss.shotItem[0] += 4;
                        }
                        if(endBoss.FC == 250 || endBoss.FC == 270) {
                            for(let i=0; i<30; i++) {
                                let angle = 12*i;
                                let pos = new THREE.Vector3().addVectors(new THREE.Vector3(Math.cos(angle*(Math.PI/180))*400, 0, Math.sin(angle*(Math.PI/180))*400), center)
                                SetEnemyBullet(pos, 1, 22, angle, 120);
                            }
                        }
                        if(endBoss.FC == 260) {
                            for(let i=0; i<60; i++) {
                                let angle = 6*i;
                                let pos = new THREE.Vector3().addVectors(new THREE.Vector3(Math.cos(angle*(Math.PI/180))*400, 0, Math.sin(angle*(Math.PI/180))*400), center)
                                SetEnemyBullet(pos, 1, 22, angle, 80);
                            }
                        }
                        if(endBoss.FC == 280) {
                            for(let i=0; i<30; i++) {
                                let angle = 12*i;
                                let pos = new THREE.Vector3().addVectors(new THREE.Vector3(Math.cos(angle*(Math.PI/180))*400, 0, Math.sin(angle*(Math.PI/180))*400), center)
                                SetEnemyBullet(pos, 3, 12, angle+60, 150);
                            }
                            for(let i=0; i<30; i++) {
                                let angle = 12*i + 12;
                                let pos = new THREE.Vector3().addVectors(new THREE.Vector3(Math.cos(angle*(Math.PI/180))*400, 0, Math.sin(angle*(Math.PI/180))*400), center)
                                SetEnemyBullet(pos, 3, 12, angle-60, 150);
                            }
                        }
                        if(endBoss.FC == 300) {
                            bossActions.mainOpen.stop();
                            bossActions.mainClose.play();
                        }
                        if(endBoss.FC == 330) {
                            endBoss.phase = 3;
                            endBoss.FC = 1;
                            endBoss.shotItem = [];
                        }
                    }
                    break;
                case 3:
                    if(endBoss.FC > 120 & endBoss.FC <= 360) {
                        if(!endBoss.shotItem[0] || endBoss.shotItem[0] == 0) {
                            endBoss.shotItem[0] = Math.round(Math.random() * 10) + 15;
                        }
                        if(endBoss.shotItem[0] == 1) {
                            let pos1 = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].shotPos[0].matrixWorld);
                            let pos2 = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].shotPos[1].matrixWorld);
                            SetEnemyBullet(pos1, 3, 28, 90, 250);
                            SetEnemyBullet(pos2, 3, 28, 90, 250);
                        }
                        if(endBoss.FC % 18 == 0) {
                            let pos1 = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[5].shotPos[0].matrixWorld);
                            let pos2 = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[5].shotPos[1].matrixWorld);
                            let pos3 = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[5].shotPos[2].matrixWorld);
                            let pos4 = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[5].shotPos[3].matrixWorld);
                            SetEnemyBullet(pos1, 0, 12, 90, 80);
                            SetEnemyBullet(pos2, 0, 12, 90, 80);
                            SetEnemyBullet(pos3, 0, 12, 60, 80);
                            SetEnemyBullet(pos3, 0, 12, 30, 80);
                            SetEnemyBullet(pos4, 0, 12, 120, 80);
                            SetEnemyBullet(pos4, 0, 12, 150, 80);
                        }
                        endBoss.shotItem[0]--;
                    }
                    if(endBoss.FC > 300 & endBoss.FC <= 480) {
                        let f = endBoss.FC - 300
                        endBoss.model.parts[4].rotation.y = (Math.sin(f*2*(Math.PI/180))*80) * (Math.PI/180);
                        if(endBoss.FC >= 345 & endBoss.FC <= 435 & endBoss.FC % 4 == 0) {
                            let pos = [];
                            for(let i=0; i<endBoss.model.parts[4].shotPos.length; i++) {
                                pos[i] = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[4].shotPos[i].matrixWorld);
                                SetEnemyBullet(pos[i], 1, 20, -endBoss.model.parts[4].rotation.y*(180/Math.PI)+90, 80);
                            }
                        }
                    }
                    if(endBoss.FC == 480) {
                        bossActions.frontClose.stop();
                        bossActions.frontOpen.play();
                    }
                    if(endBoss.FC >= 500 & endBoss.FC < 640) {
                        if(endBoss.FC == 500) {
                            let lpos = [
                                new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].shotPos[2].matrixWorld), new THREE.Vector3(0, 0, -120)),
                                new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].shotPos[2].matrixWorld), new THREE.Vector3(0, 0, -40)),
                                new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].shotPos[2].matrixWorld), new THREE.Vector3(0, 0, 40)),
                                new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].shotPos[2].matrixWorld), new THREE.Vector3(0, 0, 120))
                            ];
                            let rpos = [
                                new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].shotPos[3].matrixWorld), new THREE.Vector3(0, 0, -120)),
                                new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].shotPos[3].matrixWorld), new THREE.Vector3(0, 0, -40)),
                                new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].shotPos[3].matrixWorld), new THREE.Vector3(0, 0, 40)),
                                new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].shotPos[3].matrixWorld), new THREE.Vector3(0, 0, 120))
                            ];
                            endBoss.bombs = [];
                            let geo = new THREE.CylinderBufferGeometry(40, 40, 70, 8);
                            let mat = new THREE.MeshLambertMaterial({color: "#282828"});
                            let obj = new THREE.Mesh(geo, mat);
                            for(let i=0; i<4; i++) {
                                let lb = obj.clone();
                                lb.velx = Math.random()*10 + 18;
                                lb.velz = Math.random()*-2 - (18-(i*8));
                                lb.FC = Math.random()*30 + 60;
                                lb.position.copy(lpos[i]);
                                endBoss.bombs.push(lb);
                                scene.add(lb);

                                let rb = obj.clone();
                                rb.velx = Math.random()*-10 - 18;
                                rb.velz = Math.random()*-2 - (18-(i*8));
                                rb.FC = Math.random()*30 + 60;
                                rb.position.copy(rpos[i]);
                                endBoss.bombs.push(rb);
                                scene.add(rb);
                            }
                        }
                        if(endBoss.FC == 520) {
                        bossActions.frontOpen.stop();
                        bossActions.frontClose.play();
                        }
                        for(let i=0; i<endBoss.bombs.length; i++) {
                            if(endBoss.bombs[i].FC <= 0) {
                                let pos = endBoss.bombs[i].position;
                                for(let i=0; i<12; i++) {
                                    let angle = (-10 + Math.random()*20) + i*30;
                                    SetEnemyBullet(pos, 0, Math.random()*6 + 10, angle, 80);
                                }

                                sounds.bomb01.currentTime = 0;
                                sounds.bomb01.play();

                                scene.remove(endBoss.bombs[i]);
                                endBoss.bombs.splice(i, 1);
                            } else {
                                endBoss.bombs[i].position.x += endBoss.bombs[i].velx;
                                if(endBoss.bombs[i].velx < 0) {
                                    endBoss.bombs[i].velx += 0.4;
                                    if(endBoss.bombs[i].velx >= 0) endBoss.bombs[i].velx = 0;
                                } else {
                                    endBoss.bombs[i].velx -= 0.4;
                                    if(endBoss.bombs[i].velx <= 0) endBoss.bombs[i].velx = 0;
                                }
                                endBoss.bombs[i].position.z += endBoss.bombs[i].velz;
                                endBoss.bombs[i].rotation.x += 0.1;
                                endBoss.bombs[i].rotation.y += 0.1;
                                endBoss.bombs[i].rotation.z += 0.05;
                                if(endBoss.bombs[i].velz >= 20) endBoss.bombs[i].velz = 20;
                                else                            endBoss.bombs[i].velz += 0.4;

                                endBoss.bombs[i].FC--;
                            }
                        }
                        if(endBoss.FC >= 600 & endBoss.FC < 660) {
                            if(endBoss.FC % 12 == 0) {
                                if(endBoss.FC == 580 || !endBoss.shotItem[1]) endBoss.shotItem[1] = 0;
                                let lpos = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].shotPos[0].matrixWorld);
                                let rpos = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].shotPos[0].matrixWorld);
                                for(let i=0; i<=endBoss.shotItem[1]; i++) {
                                    SetEnemyBullet(lpos, 3, 18, i*14 + (endBoss.shotItem[1])*-7 + 90, 250);
                                    SetEnemyBullet(rpos, 3, 18, i*14 + (endBoss.shotItem[1])*-7 + 90, 250);
                                }
                                endBoss.shotItem[1]++;
                            }
                        }
                    }
                    if(endBoss.FC == 680) {
                        endBoss.FC = 1;
                        endBoss.phase = 1;
                        endBoss.shotItem = [];
                        endBoss.moveItem = [];
                        endBoss.model.position.set(0, 0, -1000);
                    }
                    break;

                case 11:
                    let angleL = LookPlayer(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].matrixWorld)) - 90;
                    if(angleL >= -80) {
                        if(angleL > 80)       angleL = 80;
                        else if(angleL < -80) angleL = -80;
                    } else {
                        if(angleL >= -160)     angleL = -80;
                        else if(angleL < -160) angleL = 80;
                    }
                    if(endBoss.FC >= 600) angleL = 0;
                    let disB = endBoss.model.parts[1].rotation.y*(180/Math.PI) + angleL;
                    if(disB >= 0) {
                        if(Math.abs(disB) > 2) endBoss.model.parts[1].rotation.y -= 2*(Math.PI/180);
                        else                   endBoss.model.parts[1].rotation.y = -angleL*(Math.PI/180);
                    } else {
                        if(Math.abs(disB) > 2) endBoss.model.parts[1].rotation.y += 2*(Math.PI/180);
                        else                   endBoss.model.parts[1].rotation.y = -angleL*(Math.PI/180);
                    }

                    let angleR = LookPlayer(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].matrixWorld)) - 90;
                    if(angleR >= -80) {
                        if(angleR > 80)       angleR = 80;
                        else if(angleR < -80) angleR = -80;
                    } else {
                        if(angleR >= -160)     angleR = -80;
                        else if(angleR < -160) angleR = 80;
                    }
                    if(endBoss.FC > 600) angleR = 0;
                    disB = endBoss.model.parts[2].rotation.y*(180/Math.PI) + angleR;
                    if(disB >= 0) {
                        if(Math.abs(disB) > 2) endBoss.model.parts[2].rotation.y -= 2*(Math.PI/180);
                        else                   endBoss.model.parts[2].rotation.y = -angleR*(Math.PI/180);
                    } else {
                        if(Math.abs(disB) > 2) endBoss.model.parts[2].rotation.y += 2*(Math.PI/180);
                        else                   endBoss.model.parts[2].rotation.y = -angleR*(Math.PI/180);
                    }

                    if(endBoss.FC <= 600) {
                        endBoss.model.parts[1].rotation.z += 1.8*(Math.PI/180);
                        endBoss.model.parts[2].rotation.z -= 1.8*(Math.PI/180);

                        if(endBoss.FC == 60) {
                            bossActions.bitLClose.stop();
                            bossActions.bitRClose.stop();
                            bossActions.bitLOpen.play();
                            bossActions.bitROpen.play();
                        }
                        if(endBoss.FC % 80 == 0) {
                            let lpos = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].shotPos[0].matrixWorld); 
                            let rpos = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].shotPos[0].matrixWorld); 
                            SetEnemyBullet(lpos, 2, 20, angleL+90, 250);
                            SetEnemyBullet(rpos, 2, 20, angleR+90, 250);
                        }
                        if(endBoss.FC > 80) {
                            if(endBoss.FC % 80 == 20) {
                                let poses = [
                                    new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].shotPos[1].matrixWorld),
                                    new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].shotPos[2].matrixWorld),
                                    new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].shotPos[3].matrixWorld),
                                    new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].shotPos[4].matrixWorld)
                                ];
                                for(let i=0; i<poses.length; i++) {
                                    SetEnemyBullet(poses[i], 0, 18, angleL+90, 80);
                                    SetEnemyBullet(poses[i], 0, 18, angleL+60, 80);
                                    SetEnemyBullet(poses[i], 0, 18, angleL+120, 80);
                                }
                            }
                            if(endBoss.FC % 80 == 60) {
                                let poses = [
                                    new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].shotPos[1].matrixWorld),
                                    new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].shotPos[2].matrixWorld),
                                    new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].shotPos[3].matrixWorld),
                                    new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].shotPos[4].matrixWorld)
                                ];
                                for(let i=0; i<poses.length; i++) {
                                    SetEnemyBullet(poses[i], 0, 18, angleR+90, 80);
                                    SetEnemyBullet(poses[i], 0, 18, angleR+60, 80);
                                    SetEnemyBullet(poses[i], 0, 18, angleR+120, 80);
                                }
                            }
                        }
                        if(endBoss.FC % 200 == 0) {
                            let wp = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[0].shotPos.matrixWorld);
                            let pa = LookPlayer(wp);
                            for(let i=0; i<9; i++) {
                                let angle = pa - 40 + i*10;
                                let pos = new THREE.Vector3(Math.cos(angle*(Math.PI/180))*400 + wp.x, wp.y, Math.sin(angle*(Math.PI/180))*400 + wp.z)
                                SetEnemyBullet(pos, 3, 16, angle, 250);
                            }
                        }
                    }

                    if(endBoss.FC == 630) {
                        endBoss.model.parts[1].rotation.z = 0;
                        endBoss.model.parts[2].rotation.z = 0;
                        bossActions.bitLOpen.stop();
                        bossActions.bitROpen.stop();
                        bossActions.bitLClose.play();
                        bossActions.bitRClose.play();
                    }
                    if(endBoss.FC == 660) {
                        endBoss.FC = 1;
                        endBoss.phase = 12;
                        endBoss.moveItem = [];
                        endBoss.shotItem = [];
                    }
                    break;
                case 12:
                    if(endBoss.FC > 60 & endBoss.FC <= 960) {
                        if(endBoss.FC % 60 >= 30) {
                            if(endBoss.FC % 3 == 0) {
                                let lpos = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].shotPos[0].matrixWorld); 
                                let rpos = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].shotPos[0].matrixWorld);
                                SetEnemyBullet(lpos, 3, 16, -endBoss.model.parts[1].rotation.y*(180/Math.PI) + 90, 200);
                                SetEnemyBullet(rpos, 3, 16, -endBoss.model.parts[2].rotation.y*(180/Math.PI) + 90, 200);
                            }
                        }
                        if(endBoss.FC >= 550 & endBoss.FC % 10 == 0) {
                            let lposes = [
                                new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].shotPos[1].matrixWorld),
                                new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].shotPos[2].matrixWorld),
                                new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].shotPos[3].matrixWorld),
                                new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].shotPos[4].matrixWorld)
                            ];
                            let rposes = [
                                new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].shotPos[1].matrixWorld),
                                new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].shotPos[2].matrixWorld),
                                new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].shotPos[3].matrixWorld),
                                new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].shotPos[4].matrixWorld)
                            ];
                            for(let i=0; i<lposes.length; i++) {
                                SetEnemyBullet(lposes[i], 0, 18, -endBoss.model.parts[1].rotation.y*(180/Math.PI) + 90, 80);
                                SetEnemyBullet(rposes[i], 0, 18, -endBoss.model.parts[2].rotation.y*(180/Math.PI) + 90, 80);
                            }
                        }
                        if(endBoss.FC % 100 == 0) {
                            let wp = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[0].shotPos.matrixWorld);
                            let pa = LookPlayer(wp);
                            for(let i=0; i<32; i++) {
                                let angle = 11.25*i + pa;
                                let pos = new THREE.Vector3(Math.cos(angle*(Math.PI/180))*400 + wp.x, wp.y, Math.sin(angle*(Math.PI/180))*400 + wp.z)
                                SetEnemyBullet(pos, 1, 28, angle, 120);
                            }
                        }
                    }
                    if(endBoss.FC == 510) {
                        bossActions.bitLClose.stop();
                        bossActions.bitRClose.stop();
                        bossActions.bitLOpen.play();
                        bossActions.bitROpen.play();
                    }
                    if(endBoss.FC == 960) {
                        bossActions.bitLOpen.stop();
                        bossActions.bitROpen.stop();
                        bossActions.bitLClose.play();
                        bossActions.bitRClose.play();
                    }
                    if(endBoss.FC == 1020) {
                        endBoss.FC = 1;
                        endBoss.phase = 11;
                        endBoss.moveItem = [];
                        endBoss.shotItem = [];
                    }
                    break;
                
                case 21:
                    if(!endBoss.shotItem[0]) endBoss.shotItem[0] = 0;
                    if(endBoss.FC > 120) {
                        endBoss.shotItem[0] += 6*(Math.PI/180);
                        if(endBoss.FC % 5 == 0) {
                            let wp = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[0].shotPos.matrixWorld);
                            let pa1 = LookPlayer(wp) + Math.sin(endBoss.shotItem[0])*22.5;
                            let pa2 = LookPlayer(wp) - Math.sin(endBoss.shotItem[0])*22.5;
                            for(let i=0; i<8; i++) {
                                let angle1 = (i*45+pa1);
                                let pos1 = new THREE.Vector3(Math.cos(angle1*(Math.PI/180))*400 + wp.x, wp.y, Math.sin(angle1*(Math.PI/180))*400 + wp.z)
                                SetEnemyBullet(pos1, 0, 20, angle1, 90);
                                let angle2 = (i*45+pa2);
                                let pos2 = new THREE.Vector3(Math.cos(angle2*(Math.PI/180))*400 + wp.x, wp.y, Math.sin(angle2*(Math.PI/180))*400 + wp.z)
                                SetEnemyBullet(pos2, 0, 20, angle2, 90);
                            }
                        }
                        if(endBoss.FC % 133 == 0) {
                            let wp = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[0].shotPos.matrixWorld);
                            let pa = LookPlayer(wp);
                            for(let i=0; i<30; i++) {
                                let angle = (i*12+pa);
                                let pos = new THREE.Vector3(Math.cos(angle*(Math.PI/180))*400 + wp.x, wp.y, Math.sin(angle*(Math.PI/180))*400 + wp.z)
                                SetEnemyBullet(pos, 3, 25, angle, 250);
                            }
                            for(let i=0; i<30; i++) {
                                let angle = (i*12+pa) + 6;
                                let pos = new THREE.Vector3(Math.cos(angle*(Math.PI/180))*400 + wp.x, wp.y, Math.sin(angle*(Math.PI/180))*400 + wp.z)
                                SetEnemyBullet(pos, 1, 15, angle, 140);
                                SetEnemyBullet(pos, 1, 12, angle, 110);
                                SetEnemyBullet(pos, 1, 9, angle, 80);
                            }
                        }
                    }
                    break;
            }
        }
        Moving();
        Danmaku();
        endBoss.FC++;

        function HPCtrl() {
            if(endBoss.phase < 10) {
                if(endBoss.HP <= 2600) {
                    if(endBoss.FC % 5 == 0) {
                        let exp = AnimSpriteSet(explosionImg[0], new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(100, 0, 500)), 3, 300);
                        exp.type = 2;
                        animEffects.push(exp);
                        scene.add(exp);
                    }
                    if(endBoss.HP <= 1800) {
                        if(endBoss.FC % 5 == 3) {
                            let exp = AnimSpriteSet(explosionImg[1], new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(-80, 0, 1500)), 3, 240);
                            exp.type = 2;
                            animEffects.push(exp);
                            scene.add(exp);
                        }
                    }
                }
                if(endBoss.HP <= 1000) {
                    enemyBullets.forEach((eb) => {
                        StarSet(eb.spr.position, 150, 200);
                        eb.active = false;
                    });
                    if(endBoss.bombs) {
                        endBoss.bombs.forEach((bomb) => {
                            scene.remove(bomb);
                        });
                        endBoss.bombs = [];
                    }
                    endBoss.HP = 1000;
                    endBoss.phase = 10;
                    endBoss.FC = 0;
                    endBoss.moveItem = [];
                    endBoss.shotItem = [];
                    endBoss.active = false;
                    endBoss.bitHP = 600;
                    bossActions.mainOpen.stop();
                    bossActions.mainClose.stop();
                    let expPos = [
                        new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(0, 0, 1000)),
                        new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(0, 0, 1600)),
                        new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(100, 0, 700)),
                        new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(-130, 0, 500)),
                        new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(160, 0, 1400)),
                        new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(-10, 0, 1600)),
                        new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(90, 0, 1100)),
                        new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(-120, 0, 900)),
                    ];
                    for(let i=0; i<expPos.length; i++) {
                        let exp;
                        if(i <= 1) {
                            exp = AnimSpriteSet(explosionImg[i], expPos[i], 3, 1800-i*300);
                            exp.type = 2;
                        } else {
                            exp = AnimSpriteSet(explosionImg[0], expPos[i], 2, 900);
                            exp.type = 1;
                        }
                        animEffects.push(exp);
                        scene.add(exp);
                    }

                    sounds.bomb05.currentTime = 0;
                    sounds.bomb05.play();

                    endBoss.model.remove(endBoss.model.parts[3], endBoss.model.parts[4], endBoss.model.parts[5]);
                }
            } else {
                if(endBoss.phase < 20) {
                    if(endBoss.bitHP <= 400) {
                        if(endBoss.FC % 5 == 0) {
                            let lbp = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].matrixWorld);
                            let rbp = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].matrixWorld);
                            let exp1 = AnimSpriteSet(explosionImg[0], new THREE.Vector3().addVectors(lbp, new THREE.Vector3(160, 0, 260)), 3, 200);
                            let exp2 = AnimSpriteSet(explosionImg[0], new THREE.Vector3().addVectors(rbp, new THREE.Vector3(-140, 0, -200)), 3, 200);
                            exp1.type = 2;
                            exp2.type = 2;
                            animEffects.push(exp1, exp2);
                            scene.add(exp1, exp2);
                        }
                        if(endBoss.bitHP <= 200) {
                            if(endBoss.FC % 5 == 3) {
                                let lbp = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].matrixWorld);
                                let rbp = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].matrixWorld);
                                let exp1 = AnimSpriteSet(explosionImg[1], new THREE.Vector3().addVectors(lbp, new THREE.Vector3(-180, 0, -170)), 3, 200);
                                let exp2 = AnimSpriteSet(explosionImg[1], new THREE.Vector3().addVectors(rbp, new THREE.Vector3(80, 0, 220)), 3, 200);
                                exp1.type = 2;
                                exp2.type = 2;
                                animEffects.push(exp1, exp2);
                                scene.add(exp1, exp2);
                            }
                        }
                    }
                    if(endBoss.bitHP <= 0) {
                        enemyBullets.forEach((eb) => {
                            eb.active = false;
                        });
                        let lbp = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].matrixWorld);
                        let rbp = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].matrixWorld);
                        let exp1 = AnimSpriteSet(explosionImg[1], lbp, 3, 1200);
                        let exp2 = AnimSpriteSet(explosionImg[1], rbp, 3, 1200);
                        exp1.type = 2;
                        exp2.type = 2;
                        animEffects.push(exp1, exp2);
                        scene.add(exp1, exp2);

                        sounds.bomb02.currentTime = 0;
                        sounds.bomb02.play();

                        StarSet(lbp, 800, 100000);
                        StarSet(rbp, 800, 100000);

                        endBoss.model.remove(endBoss.model.parts[1], endBoss.model.parts[2]);
                        endBoss.phase = 21;
                        endBoss.FC = 1;
                        endBoss.moveItem = [];
                        endBoss.shotItem = [];
                    }
                }
                if(endBoss.HP <= 650) {
                    if(endBoss.FC % 5 == 0) {
                        let exp = AnimSpriteSet(explosionImg[0], new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(250, 400, 200)), 3, 300);
                        exp.type = 2;
                        animEffects.push(exp);
                        scene.add(exp);
                    }
                    if(endBoss.HP <= 300) {
                        if(endBoss.FC % 5 == 3) {
                            let exp = AnimSpriteSet(explosionImg[1], new THREE.Vector3().addVectors(endBoss.model.position, new THREE.Vector3(-160, 400, -200)), 3, 240);
                            exp.type = 2;
                            animEffects.push(exp);
                            scene.add(exp);
                        }
                    }
                }
                if(endBoss.HP <= 0) {
                    enemyBullets.forEach((eb) => {
                        StarSet(eb.spr.position, 150, 200);
                        eb.active = false;
                    });
                    score += 400000 + (20000 * Math.floor(combo));
                    if(endBoss.phase < 20) {
                        let lbp = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].matrixWorld);
                        let rbp = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].matrixWorld);
                        let exp1 = AnimSpriteSet(explosionImg[1], lbp, 3, 1800);
                        let exp2 = AnimSpriteSet(explosionImg[1], rbp, 3, 1800);
                        exp1.type = 2;
                        exp2.type = 2;
                        animEffects.push(exp1, exp2);
                        scene.add(exp1, exp2)

                        sounds.bomb02.currentTime = 0;
                        sounds.bomb02.play();

                        endBoss.model.remove(endBoss.model.parts[1], endBoss.model.parts[2]);
                    }
                    let exp = AnimSpriteSet(explosionImg[1], endBoss.model.position, 3, 2400);
                    exp.type = 1;
                    animEffects.push(exp);
                    scene.add(exp);

                    sounds.bomb05.currentTime = 0;
                    sounds.bomb05.play();

                    endBoss.active = false;
                    endBoss.death = true;
                    endBoss.FC = 0;
                    endBoss.model.position.y = 0;
                }
            }
        }
        HPCtrl();
    }
    for(let i=0; i<bossAnimMixers.length; i++) {
        bossAnimMixers[i].update(1/24);
    }
}

// 敵弾生成
function SetEnemyBullet(pos, type, speed, angle, size) {
    let eb = {
        spr: new THREE.Sprite(new THREE.SpriteMaterial({map:bulletImages[type].clone()})),
        type: type,
        xmove: speed * Math.cos(angle * (Math.PI/180)),
        zmove: speed * Math.sin(angle * (Math.PI/180)),
        si: size,
        active: true
    };
    eb.spr.position.copy(ResetBPos(pos));
    if(type < 2) eb.spr.scale.set(size, size);
    else         eb.spr.scale.set(250, size);
    eb.spr.layers.set(BULLET_L);
    eb.spr.material.map.needsUpdate = true;
    eb.spr.material.map.center.x = 0.5;
    eb.spr.material.map.center.y = 0.5;
    if(type >= 2) {
        eb.spr.material.map.rotation = (-angle + 90) * (Math.PI/180);
        eb.tip1 = new THREE.Vector3((size/2) * Math.cos(angle * (Math.PI/180)), 0, (size/2) * Math.sin(angle * (Math.PI/180)));
        eb.tip2 = new THREE.Vector3((-size/2) * Math.cos(angle * (Math.PI/180)), 0, (-size/2) * Math.sin(angle * (Math.PI/180)));
    }
    scene.add(eb.spr);
    enemyBullets.push(eb);
}
// 敵弾処理
function MoveEnemyBullet() {
    if(bombed) {
        enemyBullets.forEach((bu) => {
            bu.active = false;
        });
    } else {
        // 弾移動
        enemyBullets.forEach(async function(bu, i) {
            bu.spr.position.x += bu.xmove;
            bu.spr.position.z += bu.zmove;
            const pos = bu.spr.position;
            // 範囲外 非アクティブ
            if(pos.x < -1700 || pos.x > 1700 || pos.z < -1800 || pos.z > 1800)
                bu.active = false;
        });
    }
    // 非アクティブ弾全消去
    enemyBullets.forEach(async function(bu, i) {
        if(!bu.active) {
            scene.remove(bu.spr);
            enemyBullets.splice(i, 1);
        }
    });
}

// スコアスター生成
function StarSet(position, scale, point) {
    let ss = AnimSpriteSet(scoreStar, position, 3, scale);
    ss.point = point;
    ss.velocity = -6;
    scene.add(ss);
    stars.push(ss);
}
// スコアスター処理
function StarCtrl() {
    stars.forEach((ss) => {
        if(SpriteAnimation(ss.material.map, 1/ss.material.map.repeat.x, 1/ss.material.map.repeat.y, ss.stepFrame))
            ss.material.map.offset.set(0, 0.5);
        
        if(keyShot & !player.death & !player.standby) {
            if(CircleCollider(playerCore.position, ss.position, 1400, 0) && ss.velocity > 0) {
                ss.lockP = true;
                const angle = LookPlayer(ss.position);
                ss.moveX = 60 * Math.cos(angle * (Math.PI/180));
                ss.moveZ = 60 * Math.sin(angle * (Math.PI/180));
            }
        }
        if(player.death | player.standby) {
            ss.lockP = false;
        }

        if(ss.lockP) {
            ss.position.x += ss.moveX;
            ss.position.z += ss.moveZ;
            const angle = LookPlayer(ss.position);
            ss.moveX = 60 * Math.cos(angle * (Math.PI/180));
            ss.moveZ = 60 * Math.sin(angle * (Math.PI/180));
        } else {
            if(ss.velocity < 30) ss.velocity += gravity;
            else                 ss.velocity = 30;
            ss.position.z += ss.velocity;
        }

        if(ss.position.z > 1800) {
            ss.active = false;
        } else if(CircleCollider(playerCore.position, ss.position, 80, ss.scale.x/2) & !player.death & !player.standby) {
            score += ss.point * Math.floor(combo+1);
            ss.active = false;
            sounds.getStar.currentTime = 0;
            sounds.getStar.play();
        }
    });
    // 非アクティブ消去
    stars.forEach(function(ss, i) {
        if(!ss.active) {
            scene.remove(ss);
            stars.splice(i, 1);
        }
    });
}
// プレイヤー注視
function LookPlayer(pos) {
    if(!player.death & !player.standby) {
        return Math.atan2(playerCore.position.z - pos.z, playerCore.position.x - pos.x) * (180/Math.PI);
    } else {
        return 90;
    }
}

// アニメーションスプライト生成
function AnimSpriteSet(tex, pos, stepf, scale, angle = 0) {
    let animSprite = new THREE.Sprite(new THREE.SpriteMaterial({map:tex.clone()}));
    animSprite.material.map.needsUpdate = true;
    animSprite.material.map.FC = 0;
    animSprite.stepFrame = stepf;
    animSprite.active = true;
    animSprite.ma = angle;
    animSprite.position.copy(pos);
    animSprite.scale.set(scale, scale);
    animSprite.layers.set(EFFECT_L);
    return animSprite;
}
// エフェクトアニメーション処理
function EffectCtrl() {
    // アニメーション
    animEffects.forEach(function(effect, i) {
        if(SpriteAnimation(effect.material.map, 1/effect.material.map.repeat.x, 1/effect.material.map.repeat.y, effect.stepFrame)) {
            effect.active = false;
            scene.remove(effect);
        } else {
            switch(effect.type) {
                case 1:
                case 2:
                    effect.position.z -= 6 * effect.type;
                    break;
            }
        }
    });
    // 非アクティブ消去
    animEffects.forEach(function(effect, i) {
        if(!effect.active) {
            animEffects.splice(i, 1);
        }
    });
}

// 弾座標再計算(Y=0)
function ResetBPos(bulletPos) {
    const n = new THREE.Vector3(0, 1, 0);
    const x = new THREE.Vector3(0 ,0 ,0);
    const x0 = bulletPos.clone();
    const m = x0.clone().sub(camera.position.clone());
    const h = n.clone().dot(x);
    const t = (h - n.dot(x0)) / n.dot(m);
    return x0.add(new THREE.Vector3(m.x * t, m.y * t, m.z * t));
}

// プレイヤー&敵弾衝突判定
function PlayerBulletCol() {
    if(!player.invinsible) {
        Promise.all(enemyBullets.map((bullet) => {
            switch(bullet.type) {
                case 0:
                case 1:
                    if(CircleCollider(playerCore.position, bullet.spr.position, CORE_SIZE, bullet.si/2)) {
                        PlayerDestroy();
                        console.log("Hit");
                    }
                    break;

                case 2:
                case 3:
                    const t1 = new THREE.Vector3();
                    t1.addVectors(bullet.spr.position, bullet.tip1);
                    const t2 = new THREE.Vector3();
                    t2.addVectors(bullet.spr.position, bullet.tip2);
                    if(CLCollider(playerCore.position, CORE_SIZE+5, t1, t2)) {
                        PlayerDestroy();
                        console.log("Hit");
                    }
                    break;
            }
        }));
    }
}
// プレイヤー&敵モデル衝突判定
function PlayerEnemyCol() {
    if(!player.invinsible) {
        Promise.all(enemys.map((enemy) => {
            switch(enemy.type) {
                case 1:
                case 2:
                case 3:
                    if(CircleCollider(playerCore.position, enemy.model.position, CORE_SIZE, enemy.cr)) {
                        PlayerDestroy();
                        console.log("HitModel");
                    }
                    break;
            }
        }));
        if(mediumBoss.active) {
            let bp1 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol1);
            let bp2 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol2);
            let bp3 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol3);
            let bp4 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol4);
            let bp5 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol5);
            let bp6 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol6);
            let bp7 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol7);
            let bp8 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol8);
            let bp9 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol9);
            let bp10 = new THREE.Vector3().addVectors(enemyMB.position, enemyMB.col.bcol10);
            if(CBCollider(playerCore.position, CORE_SIZE, bp1, bp2)
            || CBCollider(playerCore.position, CORE_SIZE, bp3, bp4)
            || CBCollider(playerCore.position, CORE_SIZE, bp5, bp6)
            || CBCollider(playerCore.position, CORE_SIZE, bp7, bp8)
            || CBCollider(playerCore.position, CORE_SIZE, bp9, bp10)) {
                PlayerDestroy();
                console.log("HitModel");
            }
        }
        if(endBoss.active) {
            let main = new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[0].matrixWorld)
            let lbit1 = new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].matrixWorld), new THREE.Vector3(-250, 0, -400));
            let lbit2 = new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[1].matrixWorld), new THREE.Vector3(250, 0, 450));
            let rbit1 = new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].matrixWorld), new THREE.Vector3(-250, 0, -400));
            let rbit2 = new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[2].matrixWorld), new THREE.Vector3(250, 0, 450));
            if(endBoss.phase < 10) {
                let front1 = new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].matrixWorld), new THREE.Vector3(-100, 0, 400));
                let front2 = new THREE.Vector3().addVectors(new THREE.Vector3().setFromMatrixPosition(endBoss.model.parts[3].matrixWorld), new THREE.Vector3(100, 0, 1600));
                if(CircleCollider(playerCore.position, main, CORE_SIZE, 400)
                || CBCollider(playerCore.position, CORE_SIZE, lbit1, lbit2)
                || CBCollider(playerCore.position, CORE_SIZE, rbit1, rbit2)
                || CBCollider(playerCore.position, CORE_SIZE, front1, front2)) {
                    PlayerDestroy();
                    console.log("HitModel");
                }
            } else if(endBoss.phase < 20) {
                if(CircleCollider(playerCore.position, main, CORE_SIZE, 400)
                || CBCollider(playerCore.position, CORE_SIZE, lbit1, lbit2)
                || CBCollider(playerCore.position, CORE_SIZE, rbit1, rbit2)) {
                    PlayerDestroy();
                    console.log("HitModel");
                }
            } else {
                if(CircleCollider(playerCore.position, main, CORE_SIZE, 400)) {
                    PlayerDestroy();
                    console.log("HitModel");
                }
            }
        }
    }
}
// プレイヤー撃墜処理
function PlayerDestroy() {
    if(!player.invinsible) {
        player.invinsible = true;
        player.death = true;
        player.life--;
        player.FC = 60;
        combo = 0;
        comboGauge = 0;

        let exp = AnimSpriteSet(explosionImg[0], playerPlane.position, 4, 800);
        animEffects.push(exp);
        scene.add(exp);

        sounds.playerDeath.currentTime = 0;
        sounds.playerDeath.play();

        player.shotFire.forEach( function(ele, i) {
            scene.remove(ele);
            player.shotFire.splice(i, 0);
        });
        scene.remove(playerPlane, playerBits, playerCore);
    }
}

/* 当たり判定 */
// 円どうし判定
function CircleCollider(pos1, pos2, r1, r2) {
    const dif = new THREE.Vector2(pos2.x - pos1.x, pos2.z - pos1.z);
    const difR = r1 + r2;
    if(Math.pow(dif.x, 2) + Math.pow(dif.y, 2) <= Math.pow(difR, 2))
        return true;
    else
        return false;
}
// 円と四角判定
function CBCollider(cpos, cr, bpos1, bpos2) {
    const nearest = new THREE.Vector2();
    if(cpos.x < bpos1.x)      nearest.x = bpos1.x;
    else if(cpos.x > bpos2.x) nearest.x = bpos2.x;
    else                      nearest.x = cpos.x;
    if(cpos.z < bpos1.z)      nearest.z = bpos1.z;
    else if(cpos.z > bpos2.z) nearest.z = bpos2.z;
    else                      nearest.z = cpos.z;

    return CircleCollider(cpos, nearest, cr, 0);
}
// 円と線分判定
function CLCollider(cpos, cr, lpos1, lpos2) {
    if(CircleCollider(cpos, lpos1, cr, 0) || CircleCollider(cpos, lpos2, cr, 0))
        return true;
        
    const lineV = new THREE.Vector2(lpos2.x - lpos1.x, lpos2.z - lpos1.z);
    const lineCV = new THREE.Vector2(cpos.x - lpos1.x, cpos.z - lpos1.z);
    let projectV = new THREE.Vector2();
    const d = (lineV.x * lineV.x) + (lineV.y * lineV.y);
    if (0 < d) {
		const dp = (lineV.x * lineCV.x) + (lineV.y * lineCV.y);
		projectV.x = lineV.x * (dp / d);
		projectV.y = lineV.y * (dp / d);
	} else {
		projectV.x = lineV.x;
		projectV.y = lineV.y;
	}
    const nearest = new THREE.Vector3(lpos1.x + projectV.x, 0, lpos1.z + projectV.y);

    if(CircleCollider(cpos, nearest, cr, 0)
       && (projectV.x * projectV.x) + (projectV.y * projectV.y) <= (lineV.x * lineV.x) + (lineV.y * lineV.y)
       && 0 <= (projectV.x * lineV.x) + (projectV.y * lineV.y)) {
        return true;
    } else {
        return false;
    }
}

// スプライトアニメーション
function SpriteAnimation(map, Xnum, Ynum, frame) {
    if(map.FC % frame == 0 & map.FC != 0) {
        map.offset.x += 1/Xnum;
        if(map.offset.x >= 1) {
            map.offset.x = 0;
            map.offset.y -= 1/Ynum; 
        }
    }
    map.FC++;
    if(map.offset.y < 0) return true;
    else                 return false;
}

// キーを押した判定
function onDocumentKeyDown(event) {
    const key = event.key;
    console.log("down:" + key);
    switch(key) {
        case "w":
        case "ArrowUp":
            keyUP = true;
            break;
        case "a":
        case "ArrowLeft":
            keyLEFT = true;
            break;
        case "s":
        case "ArrowDown":
            keyDOWN = true;
            break;
        case "d":
        case "ArrowRight":
            keyRIGHT = true;
            break;    
        case sKey:
            keyShot = true;
            break;
        case csKey:
            keyCShot = true;
            break;
        case bKey:
            keyBomb = true;
            break;
    }
}

// キーを離した判定
function onDocumentKeyUp(event) {
    const key = event.key;
    console.log("up:" + key);
    switch(key) {
        case "w":
        case "ArrowUp":
            keyUP = false;
            break;
        case "a":
        case "ArrowLeft":
            keyLEFT = false;
            break;
        case "s":
        case "ArrowDown":
            keyDOWN = false;
            break;
        case "d":
        case "ArrowRight":
            keyRIGHT = false;
            break;
        case sKey:
            keyShot = false;
            break;
        case csKey:
            keyCShot = false;
            break;
        case bKey:
            keyBomb = false;
            break;
    }
}

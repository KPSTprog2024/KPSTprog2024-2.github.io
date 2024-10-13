let selectedImage = null;
let rows = 3;
let cols = 4;
let pieceWidth;
let pieceHeight;
let piecesGroup;
let puzzleGroup;
let gameWidth = window.innerWidth;
let gameHeight = window.innerHeight - 200; // タイトルと余白分高さを減らす
let imageKey = '';
let imageCounter = 0;
let completedImageURL = ''; // 完成画像のデータURLを保存

document.getElementById('piece-count').addEventListener('change', function (e) {
  const value = e.target.value;
  if (value === '3x4') {
    rows = 3;
    cols = 4;
  } else if (value === '4x5') {
    rows = 4;
    cols = 5;
  } else if (value === '6x8') {
    rows = 6;
    cols = 8;
  }
});

document.getElementById('upload-image').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (file && file.size <= 5 * 1024 * 1024) {
    const reader = new FileReader();
    reader.onload = function (event) {
      selectedImage = event.target.result;
      document.getElementById('start-button').disabled = false;
    };
    reader.readAsDataURL(file);
  } else {
    alert('5MB以下のPNGまたはJPG画像を選択してください。');
    document.getElementById('start-button').disabled = true;
  }
});

document.getElementById('start-button').addEventListener('click', function () {
  if (selectedImage) {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    initGame();
  }
});

document.getElementById('retry-button').addEventListener('click', function () {
  location.reload();
});

document.getElementById('reset-button').addEventListener('click', function () {
  location.reload();
});

function initGame() {
  imageCounter++;
  imageKey = 'puzzleImage_' + imageCounter;

  const config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight * 2, // 高さを2倍に設定してスクロール可能に
    parent: 'game-container',
    backgroundColor: '#8E24AA', // 背景色を紫色に設定
    scene: {
      preload: preload,
      create: create
    }
  };

  const game = new Phaser.Game(config);
}

function preload() {
  // 既存のテクスチャを削除
  if (this.textures.exists(imageKey)) {
    this.textures.remove(imageKey);
  }
}

function create() {
  const scene = this;

  // シーン全体の背景色を設定
  scene.cameras.main.setBackgroundColor('#8E24AA'); // 背景色を紫色に設定

  // 画像を新しいImageオブジェクトとしてロード
  const img = new Image();
  img.onload = function () {
    // 画像に外枠線を追加（太さ4ピクセル）
    const canvas = document.createElement('canvas');
    canvas.width = img.width + 8; // 左右に4ピクセルずつ追加
    canvas.height = img.height + 8; // 上下に4ピクセルずつ追加
    const ctx = canvas.getContext('2d');

    // 外枠線を描画
    ctx.fillStyle = '#000000'; // 枠線の色（黒）
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 元の画像を中央に描画
    ctx.drawImage(img, 4, 4);

    // 新しい画像をテクスチャとして追加
    scene.textures.addImage(imageKey, canvas);

    const texture = scene.textures.get(imageKey).getSourceImage();

    // 完成画像のデータURLを保存
    completedImageURL = canvas.toDataURL();

    // 画像サイズをゲーム画面にフィットさせる
    const scaleX = (gameWidth * 0.8) / texture.width;
    const scaleY = (gameHeight * 0.4) / texture.height; // 上部に配置するため0.4に変更
    const scale = Math.min(scaleX, scaleY);

    const imageWidth = texture.width * scale;
    const imageHeight = texture.height * scale;

    pieceWidth = Math.floor(imageWidth / cols);
    pieceHeight = Math.floor(imageHeight / rows);

    // パズルの枠を描画
    const frameX = (gameWidth - imageWidth) / 2; // 中央に配置
    const frameY = 10; // 上からの位置

    // 枠のサイズを設定
    const frameWidth = pieceWidth * cols;
    const frameHeight = pieceHeight * rows;

    // 枠を描画
    const graphics = scene.add.graphics();
    graphics.lineStyle(4, 0xFFB74D); // 枠線を太くし、明るいオレンジ色に設定
    graphics.strokeRect(frameX, frameY, frameWidth, frameHeight);
    graphics.fillStyle(0x8E24AA, 1); // 背景色を紫色に変更
    graphics.fillRect(frameX, frameY, frameWidth, frameHeight);
    graphics.setDepth(0);

    // 格子状のガイドラインを描画
    graphics.lineStyle(1, 0xFFFFFF, 0.5); // 白色のガイドライン
    // 垂直線
    for (let i = 1; i < cols; i++) {
      const x = frameX + i * pieceWidth;
      graphics.moveTo(x, frameY);
      graphics.lineTo(x, frameY + frameHeight);
    }
    // 水平線
    for (let i = 1; i < rows; i++) {
      const y = frameY + i * pieceHeight;
      graphics.moveTo(frameX, y);
      graphics.lineTo(frameX + frameWidth, y);
    }
    graphics.strokePath();

    // 完成形の画像を表示（1/1サイズ）
    const previewX = (gameWidth - imageWidth) / 2;
    const previewY = frameY + frameHeight + 20; // 枠の下に表示

    const previewImage = scene.add.image(previewX, previewY, imageKey);
    previewImage.setOrigin(0, 0);
    previewImage.setScale(scale);
    previewImage.setDepth(0);

    // ピースを生成
    piecesGroup = scene.add.group();
    puzzleGroup = scene.add.group();

    let id = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = frameX + col * pieceWidth;
        const y = frameY + row * pieceHeight;

        // ピースを作成
        const pieceTextureKey = imageKey + '_piece_' + id;

        // ピースのテクスチャを作成
        const canvasTexture = scene.textures.createCanvas(pieceTextureKey, pieceWidth, pieceHeight);
        const ctx = canvasTexture.context;
        ctx.drawImage(
          texture,
          (col * pieceWidth) / scale,
          (row * pieceHeight) / scale,
          pieceWidth / scale,
          pieceHeight / scale,
          0,
          0,
          pieceWidth,
          pieceHeight
        );
        canvasTexture.refresh();

        // ピーススプライトを作成
        const piece = scene.add.image(0, 0, pieceTextureKey);
        piece.setOrigin(0);
        piece.setInteractive({ draggable: true });
        scene.input.setDraggable(piece);

        // 正しい位置を記録
        piece.correctX = x;
        piece.correctY = y;

        // ランダムな位置に配置（画面上部に配置）
        const posX = Phaser.Math.Between(20, gameWidth - pieceWidth - 20);
        const posY = frameY + frameHeight + imageHeight + 40 + Phaser.Math.Between(0, 100);

        piece.x = posX;
        piece.y = posY;

        piecesGroup.add(piece);

        id++;
      }
    }

    // ドラッグイベント
    scene.input.on('dragstart', function (pointer, gameObject) {
      gameObject.setDepth(1);
    });

    scene.input.on('drag', function (pointer, gameObject, dragX, dragY) {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    scene.input.on('dragend', function (pointer, gameObject) {
      // 正しい位置に近いか確認
      const distance = Phaser.Math.Distance.Between(
        gameObject.x,
        gameObject.y,
        gameObject.correctX,
        gameObject.correctY
      );

      if (distance < 30) {
        // スナップ
        gameObject.x = gameObject.correctX;
        gameObject.y = gameObject.correctY;
        gameObject.setDepth(0);
        puzzleGroup.add(gameObject);
        piecesGroup.remove(gameObject);

        // すべてのピースが配置されたか確認
        if (piecesGroup.getChildren().length === 0) {
          scene.time.delayedCall(500, () => {
            // クリア画面に完成した画像を表示
            document.getElementById('completed-image').src = completedImageURL;

            // ランダムなメッセージを表示
            const messages = [
              'クリア！ がんばったね！',
              'すごい！ 完璧だよ！',
              'やったね！ おめでとう！',
              '素晴らしい！ よくできました！',
              '最高！ 天才だね！',
              'すごい集中力！',
              '素敵なパズルが完成したね！',
              '驚いた！ とても早かったよ！',
              '大成功！ 楽しかったかな？',
              'やった！ 次も挑戦してみよう！'
            ];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            document.getElementById('clear-message').textContent = randomMessage;

            document.getElementById('game-screen').style.display = 'none';
            document.getElementById('game-clear-screen').style.display = 'block';
          });
        }
      }
    });
  };

  img.src = selectedImage;
}

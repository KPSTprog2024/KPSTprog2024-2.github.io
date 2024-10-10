let selectedImage = null;
let rows = 6;
let cols = 8;
let pieceWidth;
let pieceHeight;
let piecesGroup;
let puzzleGroup;
let gameWidth = window.innerWidth;
let gameHeight = window.innerHeight - 50; // 50はリセットボタンの高さを考慮

document.getElementById('piece-count').addEventListener('change', function (e) {
  const value = e.target.value;
  if (value === '6x8') {
    rows = 6;
    cols = 8;
  } else if (value === '9x12') {
    rows = 9;
    cols = 12;
  }
});

document.getElementById('upload-image').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (file && file.size <= 5 * 1024 * 1024) {
    const reader = new FileReader();
    reader.onload = function (event) {
      selectedImage = new Image();
      selectedImage.onload = function () {
        document.getElementById('start-button').disabled = false;
      };
      selectedImage.src = event.target.result;
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
  const config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    parent: 'game-container',
    scene: {
      preload: preload,
      create: create
    }
  };

  const game = new Phaser.Game(config);

  function preload() {
    // 画像をテクスチャとして読み込み
    this.textures.addBase64('puzzleImage', selectedImage.src);
  }

  function create() {
    const scene = this;
    const texture = this.textures.get('puzzleImage').getSourceImage();

    // 画像サイズをゲーム画面にフィットさせる
    const scaleX = gameWidth / texture.width;
    const scaleY = gameHeight / texture.height;
    const scale = Math.min(scaleX, scaleY);

    const imageWidth = texture.width * scale;
    const imageHeight = texture.height * scale;

    pieceWidth = Math.floor(imageWidth / cols);
    pieceHeight = Math.floor(imageHeight / rows);

    // ピースを生成
    piecesGroup = this.add.group();
    puzzleGroup = this.add.group();

    let id = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * pieceWidth;
        const y = row * pieceHeight;

        // ピースを作成
        const pieceTextureKey = 'piece_' + id;

        // ピースのテクスチャを作成
        this.textures.createCanvas(pieceTextureKey, pieceWidth, pieceHeight);
        const canvas = this.textures.get(pieceTextureKey).getSourceImage();
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          texture,
          x / scale,
          y / scale,
          pieceWidth / scale,
          pieceHeight / scale,
          0,
          0,
          pieceWidth,
          pieceHeight
        );
        this.textures.get(pieceTextureKey).refresh();

        // ピーススプライトを作成
        const piece = this.add.image(0, 0, pieceTextureKey);
        piece.setOrigin(0);
        piece.setInteractive();
        this.input.setDraggable(piece);

        // 正しい位置を記録
        piece.correctX = x;
        piece.correctY = y;

        // ランダムな位置に配置（右側の縦2列）
        const posX = gameWidth - pieceWidth * (Math.random() < 0.5 ? 2 : 1) - Phaser.Math.Between(0, 10);
        const posY = Phaser.Math.Between(0, gameHeight - pieceHeight);

        piece.x = posX;
        piece.y = posY;

        piecesGroup.add(piece);

        id++;
      }
    }

    // ドラッグイベント
    this.input.on('dragstart', function (pointer, gameObject) {
      gameObject.setDepth(1);
    });

    this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on('dragend', function (pointer, gameObject) {
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
            document.getElementById('game-screen').style.display = 'none';
            document.getElementById('game-clear-screen').style.display = 'block';
          });
        }
      }
    });
  }
}

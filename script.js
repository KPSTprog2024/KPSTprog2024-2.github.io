let selectedImage = null;
let rows = 6;
let cols = 8;

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
      selectedImage = event.target.result;
      document.getElementById('start-button').disabled = false;
    }
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
  const puzzleContainer = document.getElementById('puzzle-container');

  // パズルコンテナをクリア
  puzzleContainer.innerHTML = '';

  const options = {
    imageURL: selectedImage,
    rows: rows,
    columns: cols,
    hoverShadow: false,
    success: function () {
      document.getElementById('game-screen').style.display = 'none';
      document.getElementById('game-clear-screen').style.display = 'block';
    },
    cut: {
      shape: 'classic'
    },
    pieces: {
      snap: {
        fit: true,
        acceptTolerance: 20
      },
      draggable: true,
      rotatable: false
    },
    drag: {
      touch: true
    }
  };

  // JigsawJsを使用してパズルを生成
  const puzzle = new Jigsaw(puzzleContainer, options); // ここを確認

  // ピースを右側に配置
  arrangePiecesOutside(puzzle);
}

function arrangePiecesOutside(puzzle) {
  const puzzleContainer = document.getElementById('puzzle-container');
  const pieces = puzzle.pieces;
  const containerWidth = puzzleContainer.offsetWidth;
  const containerHeight = puzzleContainer.offsetHeight;

  // ピースのサイズを取得
  const pieceWidth = pieces[0].width;
  const pieceHeight = pieces[0].height;

  // キャンバスの右側に縦2列でピースを配置
  let xOffset = containerWidth - (pieceWidth * 2) - 10; // 右側に余白を持たせる
  let yOffset = 10;

  pieces.forEach((piece, index) => {
    piece.element.set({
      left: xOffset,
      top: yOffset
    });
    piece.element.setCoords();

    yOffset += pieceHeight + 10;

    // 縦にスペースがなくなったら次の列へ
    if (yOffset + pieceHeight > containerHeight) {
      xOffset += pieceWidth + 10;
      yOffset = 10;
    }
  });

  puzzle.canvas.renderAll();
}

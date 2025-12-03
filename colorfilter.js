const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const img = new Image();
img.src = `./filtering/spriteColorDownload.png`;
img.onload = function () {
  ctx.drawImage(img, 0, 0); // Draws the image at the top-left corner (0,0)
  const imgColors = ctx.getImageData(0, 0, 30, 30).data;
  let extractedColors = [];
  for (let i = 0, j = 0; i < imgColors.length; i += 4, j++) {
    const r = imgColors[i];
    const g = imgColors[i + 1];
    const b = imgColors[i + 2];
    const a = imgColors[i + 3];
    if (a === 255) extractedColors.push([r, g, b, a]);
  }
  console.log(extractedColors);
};
function colorFilter() {}

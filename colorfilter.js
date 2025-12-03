const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const img = new Image();
img.src = `./filtering/spriteColorDownload.png`;
img.onload = async function () {
  ctx.drawImage(img, 0, 0); // Draws the image at the top-left corner (0,0)
  const imgColors = ctx.getImageData(0, 0, 30, 30).data;
  let extractedColors = new Set();
  for (let i = 0, j = 0; i < imgColors.length; i += 4, j++) {
    const r = imgColors[i];
    const g = imgColors[i + 1];
    const b = imgColors[i + 2];
    const a = imgColors[i + 3];
    if (a === 255) extractedColors.add(`${r},${g},${b}`);
  }
  const colorsetfile = await (await fetch("./glasbey_bw_filtered.txt")).text();
  const list = colorsetfile.replace(/\r?\n/g, "//").split("//");
  const glasbeySet = new Set(
    list.filter((e) => !extractedColors.has(e.split(" ").join(",")))
  );
  const browns = Array.from(glasbeySet).filter((e) => {
    const [r, g, b] = e.split(" ").map((e) => Number(e));
    const rg = r > b && g > b;
    const les = g > r + 20;
    const les2 = r > g + 70;
    return rg && !les && b < 50 && !les2 && r < 200 && g < 200;
  });
  // document.body.insertAdjacentText("beforeend", glasbeySet);
  display(browns);
};
function colorFilter() {}
function display(list) {
  list.forEach((e) => {
    document
      .querySelector("#temp-display")
      .insertAdjacentHTML(
        "beforeend",
        `<div style="background: rgb(${e});" class="colorSwatch">${e}</div>`
      );
  });
}

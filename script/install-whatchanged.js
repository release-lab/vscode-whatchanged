/* eslint-disable */
const fs = require("fs");
const path = require("path");
const tar = require("tar");
const download = require("download");
const ProgressBar = require("progress");

const archMaps = {
  x32: "386",
  ia32: "386",
  armhf: 'armv7',
  arm: "armv7",
  x64: "amd64",
};

const target = process.env.TARGET || `${process.platform}-${process.arch}`

const [_platform, _arch] = target.split('-')

function getPlatform(p) {
  switch (p) {
    case 'win32':
      return 'windows'
    case 'alpine':
      return 'linux'
    default:
      return p
  }
}

const version = "v0.5.6";
const platform = getPlatform(_platform)
const arch = archMaps[_arch] ?? _arch;

const url = new URL(
  `https://github.com/release-lab/whatchanged/releases/download/${version}/whatchanged_${platform}_${arch}.tar.gz`
);

console.log("Downloading: ", url.toString());

const bar = new ProgressBar("[:bar] :percent :etas", {
  complete: "=",
  incomplete: " ",
  width: 20,
  total: 0,
});

const filename = path.posix.basename(url.pathname);

const file = fs.createWriteStream(filename);

download(url)
  .on("response", (res) => {
    bar.total = res.headers["content-length"];
    res.on("data", (data) => bar.tick(data.length));
  })
  .on("error", () => {
    fs.unlinkSync(filename);
  })
  .pipe(file)
  .on("finish", () => {
    fs.createReadStream(filename)
      .pipe(
        tar.extract({
          C: "./vendor",
          strip: 0,
        })
      )
      .on("finish", () => {
        fs.unlinkSync(filename);
      });
  });

/* eslint-disable */
const http = require("https"); // or 'https' for https:// URLs
const fs = require("fs");
const path = require("path");
const tar = require("tar");
const zlib = require("zlib");
const download = require("download");
const ProgressBar = require("progress");

const archMaps = {
  x32: "386",
  ia32: "386",
  arm: "arm7",
  x64: "amd64",
};

const version = "v0.4.1";
const platform = process.platform === "win32" ? "windows" : process.platform;
const arch = archMaps[process.arch] ?? process.arch;

const url = new URL(
  `https://github.com/whatchanged-community/whatchanged/releases/download/${version}/whatchanged_${platform}_${arch}.tar.gz`
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

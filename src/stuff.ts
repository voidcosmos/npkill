//const glob = require("glob");
//
//glob(__dirname + "../../../**/node_modules", { ignore: "node_modules/**" }, (err, files) => {
//  console.log(files);
//});

// var Glob = require("glob").Glob;
// var mg = new Glob(
//   __dirname + "../../../**/node_modules",
//   { ignore: "node_modules/**/node_modules/**", nosort: true },
//   () => {}
// );
// mg.on("match", newResult);
//

//  Work
function newResult(result) {
  console.log(result);
}

const fg = require("fast-glob");

const stream = fg.stream(["../**/[node_modules]/"], {
  onlyDirectories: true,
  matchBase: true
});

stream.on("data", newResult);
stream.once("error", console.log);

/*---------------
const { lstatSync, readdirSync } = require("fs");
const { join } = require("path");

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source)
    .map(name => join(source, name))
    .filter(isDirectory);

console.log(getDirectories("/"));
*/

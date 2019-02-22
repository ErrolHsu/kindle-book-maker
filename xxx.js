const fs = require('fs');
const readline = require('readline');
const { ncp } = require('ncp');

async function processLineByLine() {
  const fileStream = fs.createReadStream('/Users/errol/pro/tmp2/3.xhtml');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    console.log(`Line from file: ${line}`);
  }
}

function xxx() {
  const source = '/Users/errol/pro/kindle-maker/scaffold'
  const destination = '/Users/errol/pro/epub/newbook'
  ncp(source, destination, function (err) {
    if (err) {
      return console.error(err);
    }
    console.log('done!');
   });
}

xxx()
// processLineByLine();

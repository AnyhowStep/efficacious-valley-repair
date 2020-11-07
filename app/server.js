var lzString = require("lz-string")
var regex2dfa = require('regex2dfa/regex2dfa.js');

// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const app = express();

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

// send the default array of dreams to the webpage
app.get("/to-dfa", (request, response) => {
  // express helps us take JS objects and send them as JSON
  var str = regex2dfa.regex2dfa(request.query.regex);
  console.log(str);
  const lines = str
      .split("\n")
      .filter(s => s != "");

  const result = {
      startState : "0",
      acceptStates : [],
      transitions : {},
  }

  for (const line of lines) {
      const [src, dst, letter] = line.split("\t");
      let state = result.transitions[src];
      if (state == undefined) {
          state = {};
          result.transitions[src] = state;
      }
      if (dst == undefined) {
          result.acceptStates.push(src);
          continue;
      }
      let arr = state[dst];
      if (arr == undefined) {
        arr = [];
        state[dst] = arr;
      }
      arr.push(letter)
  }
  
  const output = [];
  output.push(`
type Head<StrT extends string> = StrT extends \`$\{infer HeadT}$\{string}\` ? HeadT : never;

type Tail<StrT extends string> = StrT extends \`$\{string}$\{infer TailT}\` ? TailT : never;

interface Dfa {
    startState : string,
    acceptStates : string,
    transitions : Record<string, Record<string, string>>,
}
type AcceptsImpl<
    DfaT extends Dfa,
    StateT extends string,
    InputT extends string
> =
    InputT extends "" ?
    (StateT extends DfaT["acceptStates"] ? true : false) :
    AcceptsImpl<
        DfaT,
        DfaT["transitions"][StateT][Head<InputT>],
        Tail<InputT>
    >;

type Accepts<DfaT extends Dfa, InputT extends string> = AcceptsImpl<DfaT, DfaT["startState"], InputT>;
`)
  output.push(`interface MyDfa {`);
  output.push(`    startState : ${JSON.stringify(result.startState)},`);
  output.push(`    acceptStates : ${result.acceptStates.map(s => JSON.stringify(s)).join("|")},`);
  output.push(`    transitions : {`)
  
  for (const [src, transition] of Object.entries(result.transitions)) {
    output.push(`        ${JSON.stringify(src)}: `)
    for (const [dst, letter] of Object.entries(transition)) {
      output.push(`             & Record<${letter.map(letter => JSON.stringify(String.fromCharCode(letter))).join("|")}, ${JSON.stringify(dst)}>`)
    }
    output.push(`             & Record<string, "fail">,`)
  }
  output.push(`        "fail": Record<string, "fail">,`)
  output.push(`    },`)
  output.push(`}`)
  output.push(``)
  output.push(`type InLanguage_0 = Accepts<MyDfa, ""> /** Insert your string here */`)

  response.json({
    dfa : JSON.stringify(result, null, 2) + "\n" + output.join("\n"),
    url : `https://www.typescriptlang.org/play?ts=4.1.0-dev.20201015#code/` + lzString.compressToEncodedURIComponent(output.join("\n"))
  });
});

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// client-side js, loaded by index.html
// run by the browser each time the page is loaded

console.log("hello world :o");

// a helper function that creates a list item for a given dream
function regexToDfa() {
  const input = document.getElementById("input").value
  fetch("/to-dfa?regex="+encodeURIComponent(input))
    .then(response => response.json()) // parse the JSON from the server
    .then(body => {
      document.getElementById("output").value = body.dfa;
      const url = document.getElementById("url");
      url.href = body.url
      url.innerHTML = "TS Playground ("+input+")"
      url.style.display = "inline"
  });

}

// fetch the initial list of dreams

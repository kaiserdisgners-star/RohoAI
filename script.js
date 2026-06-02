const API_KEY="WEKA_GEMINI_KEY_HAPA";

const chat=
document.getElementById("chat");


function addMessage(text,type){

const div=
document.createElement("div");

div.className=
`message ${type}`;

div.innerText=text;

chat.appendChild(div);

chat.scrollTop=
chat.scrollHeight;

return div;

}



async function sendMessage(){

const input=
document.getElementById("prompt");

const text=
input.value.trim();

if(!text)return;


addMessage(text,"user");

input.value="";


const loading=
addMessage(

"● ● ●",

"ai"

);


try{

const response=
await fetch(

`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,

{

method:"POST",

headers:{

"Content-Type":

"application/json"

},

body:

JSON.stringify({

contents:[{

parts:[{

text:text

}]

}]

})

}

);


const data=
await response.json();

loading.remove();


const reply=

data.candidates?.[0]

?.content

?.parts?.[0]

?.text ||

"No response";


addMessage(reply,"ai");

}

catch{

loading.innerText=

"Connection Error";

}

}
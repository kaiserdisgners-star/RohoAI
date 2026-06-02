const API_KEY="WEKA_GEMINI_KEY_HAPA";

const chat =
document.getElementById("chat");


/* Load previous messages */

let memory = JSON.parse(

localStorage.getItem("roho_memory")

) || [];



function saveMemory(){

localStorage.setItem(

"roho_memory",

JSON.stringify(memory)

);

}



function addMessage(text,type){

const div = document.createElement("div");

div.className = `message ${type}`;

div.innerText = text;

chat.appendChild(div);

chat.scrollTop = chat.scrollHeight;

return div;

}



/* show old chat after refresh */

memory.forEach(msg=>{

addMessage(

msg.text,

msg.type

);

});



async function sendMessage(){

const input =

document.getElementById("prompt");

const text =

input.value.trim();

if(!text)return;



addMessage(text,"user");

memory.push({

type:"user",

text:text

});

saveMemory();



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

body:JSON.stringify({

contents:[{

parts:[{

text:

memory

.slice(-20)

.map(

m=>`${m.type}: ${m.text}`

)

.join("\n")

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

?.content?.parts?.[0]

?.text ||

"No response";



addMessage(reply,"ai");



memory.push({

type:"ai",

text:reply

});



saveMemory();

}

catch{

loading.innerText=

"Connection Error";

}

}



/* optional clear memory */

function clearMemory(){

localStorage.removeItem(

"roho_memory"

);

location.reload();

}
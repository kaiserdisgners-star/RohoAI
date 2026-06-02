const API_KEY="WEKA_GEMINI_KEY_HAPA";

const chat =
document.getElementById("chat");



/* PROFILE */

let profile = JSON.parse(

localStorage.getItem(

"roho_profile"

)

)||{

name:"Guest"

};



function loadProfile(){

document

.getElementById("username")

.innerText=

profile.name;

}



function editProfile(){

const name=

prompt(

"Your name",

profile.name

);

if(name){

profile.name=name;

localStorage.setItem(

"roho_profile",

JSON.stringify(profile)

);

loadProfile();

}

}



loadProfile();



/* MEMORY */

let memory = JSON.parse(

localStorage.getItem(

"roho_memory"

)

)||[];



function saveMemory(){

localStorage.setItem(

"roho_memory",

JSON.stringify(memory)

);

}



/* MESSAGE UI */

function addMessage(

text,

type

){

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



/* LOAD OLD CHATS */

memory.forEach(msg=>{

addMessage(

msg.text,

msg.type

);

});



/* SEND MESSAGE */

async function sendMessage(){

const input=

document.getElementById(

"prompt"

);

const text=

input.value.trim();

if(!text)return;



addMessage(

text,

"user"

);



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



const conversation =

memory

.slice(-20)

.map(

m=>`${m.type}: ${m.text}`

)

.join("\n");



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

text:

`

You are RohoAI.

User name:

${profile.name}

Conversation:

${conversation}

Current message:

${text}

Reply naturally.

`

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

"Samahani, sijapata jibu.";



addMessage(

reply,

"ai"

);



memory.push({

type:"ai",

text:reply

});



saveMemory();

}



catch(error){



loading.innerText=

"Connection Error";



console.log(

error

);

}



}



/* ENTER KEY */

document

.getElementById(

"prompt"

)

.addEventListener(

"keypress",

function(e){

if(

e.key==="Enter"

){

sendMessage();

}

}

);



/* CLEAR MEMORY */

function clearMemory(){

localStorage.removeItem(

"roho_memory"

);

location.reload();

}
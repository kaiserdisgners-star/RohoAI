function jibu(){

let swali =
document.getElementById("swali")
.value
.toLowerCase();

let response="";

if(swali.includes("habari")){

response="Habari 👋";

}

else{

response="Bado najifunza";

}

document
.getElementById("majibu")
.innerText=response;

}
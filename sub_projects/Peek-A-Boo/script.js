let click_guess = 0;
let flipNum = 0;
let answer = "walrus";

function flip(element) {
  if (element.style.background == "none") {
    //already flipped
  } else {
    //not yet flipped

    element.style.background = "none";
    click_guess += 1;
    flipNum += 1;
    console.log(click_guess, flipNum);
    document.querySelector(".score").textContent = `Score: ${click_guess}`;
  }
}

function check() {
  let userGuess = document.querySelector(".guess").value;

  click_guess += 1;
  console.log(click_guess, userGuess);
  document.querySelector(".score").textContent = `Score: ${click_guess}`;

  let msgObj = document.querySelector(".msg");
  if (userGuess.toLowerCase() == answer) {
    msgObj.textContent = `You are right! It is a ${answer}!`;
  } else {
    msgObj.textContent = `Not a ${userGuess}. Keep clicking and guessing!`;
  }
  document.querySelector(".guess").value = ""; //clear input
}

document.querySelector(".btn").addEventListener("click", check);

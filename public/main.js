var db = firebase.app().firestore();

let numberElements = document.querySelectorAll(".numbers");

for (let index = 0; index < numberElements.length; index++) {
    const element = numberElements[index];
    element.classList.add(index % 2 == 0 ? "even" : "odd");
}

var GameData = {};
var gameID = null;
let unsubscribe;
LoadLatest();
async function LoadLatest() {
    var historyRef = await db.collection('yatzy').orderBy('date_created', 'desc').limit(1);
    gameID = await historyRef.get().then((collection) => {
        if (collection.docs.length > 0) {
            if (collection.docs[0].exists) {
                GameData = collection.docs[0].data();
                CreateBoard();
                return collection.docs[0].id;
            } 
        } else 
            console.error("no such document");
    }).catch(error => console.error(error));
    if (gameID == null) {
        NewGame();
    } else {
        document.querySelector("#roomID").value = gameID;
        unsubscribe = db.collection("yatzy").doc(gameID).onSnapshot((doc) => {
            GameData = doc.data();
            Object.values(players).forEach(player => {
                player.playerData = GameData[player.playerData.id];
            });
            UpdateBoard();
        });

    }
}

async function GetSaveData(ID) {
    let gameDoc = await db.collection("yatzy").doc(ID).get();
    if (gameDoc) {
        CleanUp();
        GameData = gameDoc.data();
        CreateBoard();
        gameID = ID;
        db.collection("yatzy").doc(ID).onSnapshot(doc => {
            GameData = doc.data();
            Object.values(players).forEach(player => {
                player.playerData = GameData[player.playerData.id];
            });
            UpdateBoard();
            document.querySelector("#roomID").value = ID;
        })
    } else NewGame();
} 



const body = document.querySelector("body");

const PlayerData = {
    "name": "Default",
    "id": "defaultID",
    "playerOrder": 0,
    "ones": 0,
    "twos": 0,
    "threes": 0,
    "fours": 0,
    "fives": 0,
    "sixes": 0,
    "sum": 0,
    "bonus": 0,
    "pair": 0,
    "twopair": 0,
    "threepair": 0,
    "toak": 0,
    "foak": 0,
    "fioak": 0,
    "sstraight": 0,
    "lstraight": 0,
    "fstraight": 0,
    "cabin": 0,
    "house": 0,
    "tower": 0,
    "chance": 0,
    "maxiyatzy": 0,
    "total": 0,
}

function PlayerObject(playerName, playerNameFormatted, playerOrder) {
    if(GameData[playerNameFormatted] != null) {
        this.playerData = GameData[playerNameFormatted];
    } else {
        this.playerData = {...PlayerData}
        this.playerData.name = playerName;
        this.playerData.id = playerNameFormatted;
        this.playerData.playerOrder = playerOrder;
    }

    this.UpdateSum = () => {
        let topArray = [this.playerData.ones, this.playerData.twos, this.playerData.threes, this.playerData.fours, this.playerData.fives, this.playerData.sixes]
        let sum = topArray.reduce((a,b) => {
            // only count positive values
            if (b > 0) return a + b;
            return a;
        }, 0);
        this.playerData.sum = sum;
        if (this.playerData.sum >= 84) {
            this.playerData.bonus = 100;
            document.querySelector("#"+this.playerData.id +"-bonus").value = this.playerData.bonus;
        }
        document.querySelector("#"+this.playerData.id +"-sum").value = this.playerData.sum;
    }, 

    this.AddNumber = (value, numberID) => {
        let splitID = numberID.split("-");
        let element = document.querySelector("#"+numberID);
        element.parentNode.classList.remove("filled", "failed");
        let className = "filled";
        if (isNaN(value) || value < 0) {
            value = -1;
            element.value = -1;
            className = "failed";
        }
        element.parentNode.classList.add(className);
        this.playerData[splitID[1]] = value;
    },

    this.UpdateTotal = () => {
        let totalSum = 0;
        for (const property in this.playerData) {
            if (IsFunction(property)) continue;
            if (property == "total" || property == "sum") continue;
            if (this.playerData[property] < 0) continue;
            totalSum += this.playerData[property];
        }
        this.playerData.total = totalSum;
        document.querySelector("#"+ this.playerData.id +"-total").value = this.playerData.total;
    }
}
let funWords = [
    "Apples",
    "Oranges",
    "Banananaa",
    "Peaches",
    "Poop",
    "Bloom",
    "CheezeDoodles",
    "BearNoms",
    "Smash",
    "Tiger",
    "Jaguar",
    "Batman",
    "Superman",
    "SpiderMan",
    "WonderWoman",
    "Link",
    "Zelda",
    "Zoira",
    "Applejack",
    "RainbowDash",
    "FlutterShy",
    "Twilight"
]

function GetNewRoomID() {
    let RandomInt = Math.floor(Math.random()* funWords.length);
    let id = funWords[RandomInt] + Math.floor(Math.random()*1000);
    document.querySelector("#roomID").value = id;
    return id;
}
function NewGame() {
    if (unsubscribe) unsubscribe();
    gameID = GetNewRoomID();
    CleanUp();
    SaveGame();
    db.collection("yatzy").doc(gameID).onSnapshot((doc) => {
        if (doc?.data()){
            GameData = doc.data();
            Object.values(players).forEach(player => {
                player.playerData = GameData[player.playerData.id];
            });
            UpdateBoard();
        }
    });
}

function CleanUp() {
    const allTDs = document.querySelectorAll("td");
    Array.from(allTDs).forEach(td => td.parentNode.removeChild(td));
    GameData = {};
    players = {};
}

function CreateBoard() {
    const PlayerKeys = Object.keys(GameData).filter(key => key != "date_created").sort((a, b) =>{
        return GameData[a].playerOrder > GameData[b].playerOrder ? 1 : -1;
    });
    PlayerKeys.forEach(player => {
        CreatePlayer(GameData[player].name);
    });

    Object.values(players).forEach(player => {
        player.UpdateSum();
    });
}

function UpdateBoard() {
    Object.keys(GameData).forEach(key => {
        if (key != "date_created") {
            const id = GameData[key].id;
            Object.keys(GameData[key]).forEach(data => {
                if (!IsFunction(data)) {
                    let element = document.querySelector("#"+id + "-" + data);
                    if (data != "sum" && data != "bonus") {
                        element.parentNode.classList.remove("filled", "failed");
                        if (GameData[key][data] < 0) {
                            element.parentNode.classList.add("failed");
                        } else if (GameData[key][data] > 0)
                            element.parentNode.classList.add("filled");
                    }
                    element.value = GameData[key][data];
                }
            });
        }
    });
}

function IsFunction(property) {
    switch (property) {
        case "UpdateSum":
        case "AddNumber":
        case "UpdateTotal":
        case "id":
        case "name":
        case "playerOrder":
            return true;
        default:
            return false;
    }
}

let players = {
}

function CreatePlayer(playerName) {
    const playerNameFormatted = playerName.replaceAll(" ", "").toLowerCase();
    const namesRow = document.querySelector("tr.name");
    const nameElement = document.createElement("td");
    nameElement.innerText = playerName;
    nameElement.id = playerNameFormatted;
    namesRow.appendChild(nameElement);
    let playerLength = Object.keys(players).length;
    let playerObject= new PlayerObject(playerName, playerNameFormatted, playerLength);
    for (const property in playerObject.playerData) {
        AddColumn(property, playerObject);
    }

    players[playerNameFormatted] = playerObject;
}

function AddColumn(number, playerObject) {
    if (IsFunction(number)) return;
    const row = document.querySelector(".numbers."+number);

    let tdElement = document.createElement("td");
    let numberInputElement = document.createElement("input");
    numberInputElement.type = "number";
    numberInputElement.value = 0;
    numberInputElement.id = playerObject.playerData.id + "-" + number;
    if (playerObject.playerData[number] != 0) {
        numberInputElement.value = playerObject.playerData[number];
    }
    switch (number) {
        case "ones":
        case "twos":
        case "threes":  
        case "fours":
        case "fives":
        case "sixes":
            numberInputElement.addEventListener("change", () =>  {
                playerObject.AddNumber(parseInt(numberInputElement.value), numberInputElement.id)
                playerObject.UpdateSum();
                SaveGame();
            });

            break;
        case "sum":
        case "bonus":
        case "total":
            numberInputElement.disabled = true;
        default:
            numberInputElement.addEventListener("change", () =>  {
                playerObject.AddNumber(parseInt(numberInputElement.value), numberInputElement.id); 
                SaveGame();
            });
                
            break;
    }

    tdElement.appendChild(numberInputElement);
    row.appendChild(tdElement);
}

function UpdateTotals() {
    Object.keys(players).forEach(key => {
        players[key].UpdateTotal();
    });
    let winner = null;
    let winnerSum = 0;
    Object.keys(players).forEach(key => {
        winner = players[key].playerData.total > winnerSum
        ? players[key].name 
        : winner;
        winnerSum = players[key].playerData.total;
    });
    SaveGame();
}

function hidePlayerInput() {
    document.querySelector("#playerInputContainer").style.display = "none";
    document.querySelector("#playerInputShowButton").style.display = "block";
    SaveGame();
}
function showPlayerInput() {    
    document.querySelector("#playerInputContainer").style.display = "block";
    document.querySelector("#playerInputShowButton").style.display = "none";
}

function SaveGame() {
    console.log("Saving Game");
    let playerDataCollection = {
        date_created: GameData.date_created || Date.now(),
    }
    Object.keys(players).forEach(key => {
        playerDataCollection[players[key].playerData.id] = players[key].playerData;
    });
    if (gameID == null) {
        gameID = GetNewRoomID();
    }
    db.collection("yatzy").doc(gameID).set(playerDataCollection).then((docRef) => {
    }).catch((error)=> console.error(error));
}

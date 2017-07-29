// TODO:
// STYLESHEETS FOR INDEX, PLAYERS
// REFRESH CALLS FOR EMIT
// PLAYERS WHEN THEY TIE

var express= require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);    // initialize socket.io by passing the server object

app.set('view engine', 'ejs');
app.use(express.static('public'));

// player objects for game functionality
const playerModel = function() {
    this.ready = false;
    this.score = 0;
    this.input = null;
    this.inputBool = null;
    this.cards = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    this.reset = function() {
        this.ready = false;
        this.score = 0;
        this.input = null;
        this.inputBool = null;
        this.cards = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    }
};


const playerOne = new playerModel();
const playerTwo = new playerModel();


// game info variable
const gameState = {
    round: 1
}

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
    res.render('index.ejs', {playerOne: playerOne, playerTwo: playerTwo});
});

app.get('/playerone', function(req, res) {
    res.render('./players/p1');
});

app.get('/playertwo', function(req, res) {
    res.render('./players/p2');
});

io.on('connection', function(socket) {
    console.log('page connected');
    
    socket.on('player connect', function(player) {
        console.log(player + ' is ready to play');
        
        if (player === 'playerOne') {
            playerOne.ready = true;
            console.log(playerOne);
        }
        else {
            playerTwo.ready = true;
            console.log(playerTwo);
        }
        io.emit('player connect', {gameState: gameState, playerOne: playerOne, playerTwo: playerTwo, player: player});
    });
    
    socket.on('playerOne move', function(card) {
        console.log('Player One input: ' + card);
        playerOne.input = card;
        playerOne.inputBool = true;
        playerOne.cards.splice(playerOne.cards.indexOf(card), 1);
        io.emit('player update', {playerOne: playerOne, playerTwo: playerTwo})
        console.log(playerOne);
    });
    
    socket.on('playerTwo move', function(card) {
        console.log('Player Two input: ' + card);
        playerTwo.input = card;
        playerTwo.inputBool = true;
        io.emit('player update', {playerOne: playerOne, playerTwo: playerTwo})
        console.log(playerTwo);
    });
    
    // end of round, determining score -- called by index.js after player moves
    socket.on('round', function(winner) {
        var tie = false;
        if (winner === 'playerOne') {
            playerOne.score++;
        }
        else if (winner === 'playerTwo') {
            playerTwo.score++;
        }
        else {
            console.log('tie');
            tie = true;
        }
        
        gameState.round++;
        playerOne.input = null;
        playerTwo.input = null;
        playerOne.inputBool = false;
        playerTwo.inputBool = false;
        
        console.log('Now it is round: ' + gameState.round);
        io.emit('score update', {gameState: gameState, playerOne: playerOne, playerTwo: playerTwo});
        if (tie) {
            io.emit('tie');
        }
    });
    
    socket.on('reset', function() {
        playerOne.reset();
        playerTwo.reset();
        io.emit('reset');
    })
    
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
});

http.listen(process.env.PORT, function() {
    console.log('Server is running...');
});
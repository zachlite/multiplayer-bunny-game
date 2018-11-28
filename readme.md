nextState = moreLogic(otherLogic(someLogic(currentState, input), input), input)

the client sends updates for each frame

the server buffers and processes each frame

the server sends authoritative state with an ack for each client

when the client receives an ack, it set's its state according to the server, replays all frames since the ack.

![Movie](https://media.giphy.com/media/1woAl49WZ77JWBbXQm/giphy.gif)

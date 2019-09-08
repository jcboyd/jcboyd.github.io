const node_radius = 8;


function Node(props) {
    return React.createElement('circle', {'className' : props.class_name,
        'cx' : props.cx, 'cy' : props.cy, 'r' : node_radius}, );
}

class NetworkDiagram extends React.Component {

    constructor(props) {
        super(props);

        this.layer_1_coords = []

        for (var i = 0; i < 9; i++) {
            this.layer_1_coords.push(Array(i, 30, 78 + i * 40));
        }

        this.layer_2_coords = []

        for (var i = 0; i < 16; i++) {
            this.layer_2_coords.push(Array(i, 140, 15 + i * 30));
        }

        this.layer_3_coords = []

        for (var i = 0; i < 9; i++) {
            this.layer_3_coords.push(Array(i, 250, 78 + i * 40));
        }

        this.connections_1_2 = [];

        for (var i = 0; i < this.layer_1_coords.length; i++) {
            for (var j = 0; j < this.layer_2_coords.length; j++) {
                this.connections_1_2.push(Array(
                    this.layer_1_coords[i][1] + node_radius,
                    this.layer_1_coords[i][2],
                    this.layer_2_coords[j][1] - node_radius,
                    this.layer_2_coords[j][2]));
            }
        }

        this.connections_2_3 = [];

        for (var i = 0; i < this.layer_2_coords.length; i++) {
            for (var j = 0; j < this.layer_3_coords.length; j++) {
                this.connections_2_3.push(Array(
                    this.layer_2_coords[i][1] + node_radius,
                    this.layer_2_coords[i][2],
                    this.layer_3_coords[j][1] - node_radius,
                    this.layer_3_coords[j][2]));
            }
        }
    }

    renderNode(node_type, cx, cy) {
        return React.createElement(Node, {class_name : node_type,
            cx : cx, cy : cy});
    }

    renderConnection(x1, y1, x2, y2) {
        return React.createElement('line', {'className' : 'connection',
            'x1' : x1, 'y1' : y1, 'x2': x2, 'y2' : y2});
    }

    render() {
        return React.createElement('svg', {visibility : this.props.display, 
            className : 'network-diagram', opacity : this.props.opacity},
            this.layer_1_coords.map((coord) => this.renderNode(
                this.props.nodes_layer1[coord[0]], coord[1], coord[2])),
            this.layer_2_coords.map((coord) => this.renderNode(
                this.props.nodes_layer2[coord[0]], coord[1], coord[2])),
            this.layer_3_coords.map((coord) => this.renderNode(
                this.props.nodes_layer3[coord[0]], coord[1], coord[2])),
            this.connections_1_2.map((coord) => this.renderConnection(
                coord[0], coord[1], coord[2], coord[3])),
            this.connections_2_3.map((coord) => this.renderConnection(
                coord[0], coord[1], coord[2], coord[3])));
    }
}

function Square(props) {

    return(React.createElement('button',
        {'className' : 'square', 'onClick' : props.onClick}, props.value));
}

class Board extends React.Component {

    renderSquare(i) {
        return React.createElement(Square, {value : this.props.squares[i],
            onClick : () => this.props.onClick(i)});
    }

    render() {

        return React.createElement('div', {className : 'game-board'},
               React.createElement('div', {className : 'board-row'},
                   this.renderSquare(0), this.renderSquare(1), this.renderSquare(2)),
               React.createElement('div', {className : 'board-row'},
                   this.renderSquare(3), this.renderSquare(4), this.renderSquare(5)),
               React.createElement('div', {className : 'board-row'},
                   this.renderSquare(6), this.renderSquare(7), this.renderSquare(8)));
        }
    }

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]];

    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }

    if (! squares.some((square) => square === null)) {
        return 'draw';
    }

    return null;
}

async function getNet() {
    var url = 'https://jcboyd.github.io/assets/react/tfjs_target_dir/model.json';
    var neural_net = await tf.loadLayersModel(url);
    return neural_net;
}

class Game extends React.Component {

    constructor(props) {
        super(props);
        this.state = {history : [{squares : Array(9).fill(null)}],
                      stepNumber : 0, xIsNext : true, neuralNext : true,
                      displayDiagram : 'visible',
                      nodes_layer1 : Array(9).fill('node'),
                      nodes_layer2 : Array(16).fill('node'),
                      nodes_layer3 : Array(9).fill('node')};
        this.neural_net = null;
    }

    setNeuralNet(net) {
        this.neural_net = net;
    }

    getAgentMove() {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1]
        const squares = current.squares.slice()  // first create copy

        // var neural_net = getNet();

        if (calculateWinner(squares)) {
            return [null, null, null];
        }

        var board = boardToNumeric(squares);

        let inputTensor = tf.tensor(board, [1, 3, 3, 1]);

        let probs = this.neural_net.predict(inputTensor).dataSync();

        let hidden = getActivations(this.neural_net, inputTensor).dataSync();

        probs = zeroOut(probs, board);
        const pred = tf.argMax(probs).dataSync()[0];
        return [board, hidden, pred];
    }

    updateNodes(board, hiddden, pred) {

        var nodes_layer1 = [];

        for (var i = 0; i < board.length; i++) {
            nodes_layer1.push(board[i] == 0 ? 'node' : 'active-node');
        }

        var nodes_layer2 = [];

        for (var i = 0; i < hiddden.length; i++) {
            nodes_layer2.push(hiddden[i] > 0 ? 'active-node' : 'node');
        }

        var nodes_layer3 = Array(9).fill('node');
        nodes_layer3[pred] = 'active-node';

        this.setState({nodes_layer1 : nodes_layer1,
                       nodes_layer2 : nodes_layer2,
                       nodes_layer3 : nodes_layer3});
    }

    componentDidUpdate(prevProps, prevState) {

        if(this.state.neuralNext) {
            const [board, hidden, pred] = this.getAgentMove();
            if(pred === null) {
                return;
            }
            this.makeMove(pred);
            this.updateNodes(board, hidden, pred);
        }
    }

    makeMove(i) {
        let history = this.state.history.slice(0, this.state.stepNumber + 1);
        let current = history[history.length - 1]
        let squares = current.squares.slice()  // first create copy

        if (calculateWinner(squares) || squares[i]) {
            return;
        }

        squares[i] = this.state.xIsNext ? 'x' : 'o'
        this.setState({history : history.concat([{squares : squares}]),
                       stepNumber : history.length,
                       xIsNext : !this.state.xIsNext,
                       neuralNext : !this.state.neuralNext});
    }

    goBack() {
        var step = this.state.stepNumber === 0 ? 0 : this.state.stepNumber - 1;
        this.setState({stepNumber : step,  xIsNext : (step % 2) === 0});
    }

    goForward() {

        let maxStep = this.state.history.length - 1;

        var step = this.state.stepNumber === maxStep ? maxStep : this.state.stepNumber + 1;
        this.setState({stepNumber : step, xIsNext : (step % 2) === 0});
    }

    newGame() {
        this.setState({stepNumber : 0, xIsNext : true, neuralNext : true});
    }

    switchDiagram() {
        var isVisible = this.state.displayDiagram === 'visible';
        this.setState({displayDiagram : isVisible ? 'hidden' : 'visible'});
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const winner = calculateWinner(current.squares);

        let status;

        if (winner) {
            status = 'Winner: ' + winner;
        } else {
            status = 'Next player: ' + (this.state.xIsNext ? 'x' : 'o');
        }

        return React.createElement('div', {className : 'game'},
                    React.createElement(NetworkDiagram, {
                        display : this.state.displayDiagram,
                        nodes_layer1 : this.state.nodes_layer1,
                        nodes_layer2 : this.state.nodes_layer2,
                        nodes_layer3 : this.state.nodes_layer3}),
                    React.createElement(Board, { 
                        squares : current.squares,
                        onClick : (i) => this.makeMove(i)}),
                    React.createElement('div', {className : 'game-info'},
                        React.createElement('div', {}, status)),
                        React.createElement('button', {
                            className : 'forward-back',
                            onClick : () => this.goBack()}, '<'),
                        React.createElement('button', {
                            className : 'new-game',
                            onClick : () => this.newGame()}, 'New Game'),
                        React.createElement('button', {
                            className : 'forward-back',
                            onClick : () => this.goForward()}, '>'),
                        React.createElement('button', {
                            className : 'switch-diagram',
                            onClick : () => this.switchDiagram()}, 'Toggle Net'),
                        );
    }
}

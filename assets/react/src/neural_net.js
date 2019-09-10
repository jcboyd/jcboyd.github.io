
function getActivations(model, input) {
    const layer_model = tf.sequential();
    layer_model.add(model.layers[0]);
    layer_model.add(model.layers[1]);
    layer_model.add(model.layers[2]);
    return layer_model.predict(input);
}

function createModel() {
    // Create a sequential model
    const model = tf.sequential();

    // Add a single hidden layer
    model.add(tf.layers.dense({inputShape: [9], units: 32, activation: 'relu'}));

    // Add an output layer
    model.add(tf.layers.dense({units: 9, activation: 'softmax'}));

    model.compile({
        optimizer: tf.train.adam(),
        loss: tf.losses.softmaxCrossEntropy,
        metrics: ['accuracy'],
    });

    return model;
}

function zeroOut(probs, board) {

    for(let i = 0; i < board.length; i++) {
        if(board[i] != 0) { probs[i] = 0; }
        else { probs[i] += 1e-7; }
    }
    return probs;
}

function boardToNumeric(board) {
    value_dict = {'x' : 1, 'o' : -1, null : 0};
    return board.map(x => value_dict[x]);
}

// async function getNeuralNet() {
//     url = 'https://jcboyd.github.io/assets/react/tfjs_target_dir/model.json';
//     const net = await tf.loadLayersModel(url);
//     return net;
// }

importScripts('worker-helper.js'); 

onmessage = event =>  {
    console.log('Worker: Message received from main script');
    var workerResult = 'Result: ' + helper.multiply(event.data[0], event.data[1]);
    console.log('Worker: Posting message back to main script');
    postMessage(workerResult);
}
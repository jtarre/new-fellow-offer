var worker = require('node_helper');

console.log("worker config: ", worker.config);
console.log("worker params: ", worker.params);
console.log("worker id: ", worker.task_id);
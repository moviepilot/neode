var _ = require('underscore'),
    sys = require('sys');

var Util = {
  neode: null
};

/* Given a hash you got from neo4j, representing a node,
 * this method will extract its ID from the 'self' field
 */
Util.getId = function(node) {
  return _.last(node.self.split('/'));
};

/* Little helper that joins components with /, used for 
 * a path for an index query.
 */
Util.indexPath = function(nodeType, index, value) {
  return [ '/db/data/index/node'
         , escape(nodeType)
         , escape(index)
         , escape(value)
         ].join('/');
};

/* Little helper to construct the path of a relationship
 * query.
 */
Util.relationshipPath = function(args) {
  var direction = args.direction || 'out',
      type      = args.type      || '';

  return [ '/db/data/node'
         , this.getId(args.from)
         , 'relationships'
         , direction
         , escape(type)
         ].join('/');
};

/* Little helper to construct the path of an node 
 * index deletion
 */
Util.nodeIndexDeletionPath
= function(index, node, key) {
  return [ '/db/data/index/node'
         , escape(index)
         , escape(key)
         , escape(node.data[key])
         , this.getId(node)].join('/');
};

/* Little helper to construct the path of a node index
 * addition
 */
Util.nodeIndexAddPath
= function(index, node, key, value) {
  return [ '/db/data/index/node'
         , escape(index)
         , escape(key)].join('/');
};

/* Default options for http requests to neo4j
 */
Util.defaultOptions = function() {
 return { followRedirects: true
        , headers: { 'Host': this.neode.hostPort
                   , 'Accept': 'application/json'
                   , 'Content-Type': 'application/json'
         }}; 
};

/* Merges a couple of request headers with the given
 * options
 */
Util.requestOptions = function(given) {
  var g = given || {},
      options = this.defaultOptions(); 
  _.each(g, function(value, key) {
    options[key] = value; 
  });
  if(options.data) {
    options.data = JSON.stringify(options.data);
  }
  return options;
};

/* Handles a restler error by returning false along with an
 * error object describing what went wrong.
 */
Util.handleRequestError = function(data, response, callback) {
  callback(false, { status: response.statusCode
                , response: response }); 
};

/* Handles the success event of a restler get request
 * when finding a node.
 */
Util.findNodeHandleSuccess = function(data, callback) {
  if (data.length==1) {
    callback(data[0]);
    return;
  }
  var errMsg = "Found " + data.length + " matches, not 1";
  callback(false, { error: errMsg } );
};

module.exports = Util;

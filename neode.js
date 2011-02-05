var 
  sys  = require('sys'),
  rest = require('restler'),
  _ = require('underscore');

/* Interface to Neo4j.
 *
 *
 * Usage:
 *
 * var Neode = require('neode');
 * var neo   = new Neode({ host: 'localhost', port: 7474 });
 *
 * neo.findNode('movie', 'title', 'The Matrix', function(m){ ... });
 */

function Neode(options) {
  if(! (this instanceof arguments.callee)) {
     return new arguments.calee(arguments);
  }     
  this.host = options.host;
  this.port = options.port;
  this.prefix = options.prefix || '';
  this.hostPort =  this.host+':'+this.port;
  this.base = 'http://' + this.hostPort + this.prefix;
  this.util.neode = this;
};

/* Updates the properties of a node identified by an index query.
 *
 * The indexQuery is a hash looking like this:
 *   { nodeType: 'movie'
 *   , index:    'original_title'
 *   , value:    'The Matrix'
 *   }
 *
 * If this query identifies more than one node, the callback will
 * be called with false and an additional error object.
 *
 * If this query identifies exactly one node, it will be updated
 * with the given data.
 *
 * If this query returns zero nodes, a node will be created and
 * the properties given with data will be set.
 */ 
Neode.prototype.putNode
= function(indexQuery, data, callback) {
  var self=this;
  self.findNode(indexQuery, function(node, error) {
    if(node) {
      self.setNodeProperties(node, data, function(node, meta){; 
        callback(node, meta);
      });
    } else { 
      self.createNode(data, function(node, error){
        callback(node, error); 
      });
    }
  });
};

/* Attempts to update an existing relationship. If it does not 
 * exist, it creates it.
 */
Neode.prototype.putRelationship
= function(from, to, type, data, callback) {
  var self = this,
     query = {from: from, to: to, type: type};

  self.findRelationship(query, function(rel, error) {
    
    // Update existing 
    if(rel) {
      self.setRelationshipProperties(rel, data, function(data, error) {
        if(error.statusCode && error.statusCode == 204) {
          self.getRelationship(rel, callback);
        } else {
          callback(data, error);
        }  
      }); 
    } else {
    
      // Create new
      self.createRelationship(from, to, type, data, callback);
    }
  });
};

/* Updates the properties of a pre existing node identified
 * by the "self" property. The node you pass should stick to the
 * properties defined in neo4j nodes.
 */
Neode.prototype.setNodeProperties
= function(node, callback) {
  var self = this,
      path = node.self + '/properties';
      options= self.util.requestOptions({data: node.data});
    
  // Make the kill!
  rest.put(path, options)
      .on('success', function(data) {
        callback(true);
      })
      .on('error', function(data, response) {
        self.util.handleRequestError(data, response, callback);
      }); 
};

/* Creates a node with the given data and passes it on to the 
 * given callback
 */
Neode.prototype.createNode
= function (data, callback) {
  var self = this;
  var options= self.util.requestOptions({data: data});
  
  rest.post(self.base + '/db/data/node', options)
      .on('success', function(data) {
        callback(data);
      })
      .on('error', function(data, response) {
        self.util.handleRequestError(data, response, callback);
      });
};


/* Sets the properties of an existing relationship.
 */
Neode.prototype.setRelationshipProperties
= function(rel, data, callback) {
  var self = this,
      path = rel.self + '/properties',
      options = self.util.requestOptions({data: data});

  rest.put(path, options)
      .on('success', callback)
      .on('error', function(data, response) {
        self.util.handleRequestError(data, response, callback);
      });
};

/* Creates a relationship from node `from` to node `to`. 
 * They should both be neo4j objects/hashes retrieved
 * from another neode function. 
 *
 * Calls callback with a relationship on successful connection,
 * and  with false and an error object describing what went wrong
 * (mainly status 400 invalid data and 404 node not found).
 */
Neode.prototype.createRelationship
= function(from, to, type, data, callback) {
  var self = this,
      path = from.self + '/relationships',
      edge = { to:   to.self
             , type: type
             , data: data };

  var options = self.util.requestOptions({data: edge});
  rest.post(path, options)
      .on('success', function(data, response) {
        callback(data);
      })
      .on('error', function(data, response) {
        self.util.handleRequestError(data, response, callback);
      });
};

/* Loads a relationship from neo4j. You can pass either a hash
 * containing a `self` attribute referencing the relationship,
 * or just pass a numeric ID
 */
Neode.prototype.getRelationship
= function(relationship, callback) {
  var self = this;
  if (relationship.constructor == Object) { 
    var path = relationship.self;
  } else {
    var path = self.base 
               + '/db/data/relationship/' 
               + relationship;
  } 
  rest.get(path, self.util.requestOptions())
      .on('success', function(data, response) {
        callback(data);
      })
      .on('error', function(data, response) {
        self.util.handleRequestError(data, response, callback);
      });
};

/* Attempts to find a node by searching the given index
 * for a value.
 *
 * The query is a hash looking like this:
 *   { nodeType: 'movie'
 *   , index:    'original_title'
 *   , value:    'The Matrix'
 *   }
 *
 * callback(m) is called with the node m only when exactly
 * one exact search hit has been found. 
 *
 * callback(false, error) is called, when no or more than
 * one nodes have been found. Error is a hash explaining
 * what went wrong.
 */
Neode.prototype.findNode
= function(query, callback) {
  var self = this,
      path = this.util.indexPath(query.nodeType, query.index, query.value),
      options = self.util.requestOptions();

  rest.get(self.base + path, options)
      .on('success', function(data) {
        self.util.findNodeHandleSuccess(data, callback);
      })
      .on('error', function(data, response) {
        self.util.handleRequestError(data, response, callback);
      });
};

/* Finds a relationship of a given type between two nodes. 
 * Returns it if there is exactly one, and false if there 
 * is zero or more than one relationships matching the 
 * query.
 */
Neode.prototype.findRelationship
= function(query, callback) {
  var self = this;
  self.findRelationships(query, function(data, error) {
    if (data && data.length == 1) {
      callback(data[0]);
    } else if (data) {
      callback(false, { error: 'Found '+data.length });
    } else {
      self.util.handleRequestError(data, error, callback);
    } 
  });
};


/* Gets all relationships between two nodes:
 * findRelationships({from: .., to: .., type: ''}, ..)
 */
Neode.prototype.findRelationships
= function(query, callback) {
  var self = this,
      path = self.util.relationshipPath(query),
      options = self.util.requestOptions();

  rest.get(self.base + path, options)
      .on('success', function(data){
        var rels = _.select(data, function(i) {
          return i.end == query.to.self;
        });
        callback(rels);       
      })
      .on('error', function(data, response) {
        self.util.handleRequestError(data, response, callback);
      });
};

/* Removes an entry from an index for a node's property.
 *
 * Make sure the node you pass is "valid" and has the property
 * that you wish to delete. Neo4j requires the old value in
 * order for stuff to be removed.
 */
Neode.prototype.removeFromNodeIndex
= function(index, node, key, callback) {
  var self = this,
      path = self.util.nodeIndexDeletionPath(index, node, key);

  rest.del(self.base + path, self.util.requestOptions())
      .on('success', function() {
        callback(true);
      })
      .on('error', function(data, response) {
        self.util.handleRequestError(data, response, callback);
      });

};

Neode.prototype.addToNodeIndex
= function(index, node, key, callback) {
  var self = this,
      path = self.util.nodeIndexAddPath(index, node, key);

  rest.post(self.base + path, this.util.requestOptions({data: node.self}))
      .on('success', function(data) {
        callback(true); 
      })
      .on('error', function(data, response) {
        self.util.handleRequestError(data, response, callback);
      });
}

/* Mix in some little helpers that are not part of
 * Neode's API.
 */
Neode.prototype.util = require('./lib/util');

/* We
 * be
 * done.
 */
module.exports = Neode;

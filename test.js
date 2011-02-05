var 
  sys = require('sys'),
  assert = require('assert'),
  _ = require('underscore'),
  testo = require('./lib/testo'),
  Neode = require('./neode') ;

// Usage
if (process.argv.length < 4) {
  console.log("Please supply the host and port of a neo4j instance to test on");
  console.log("Usage: node test.js 127.0.0.1 7474 [/your_prefix]"); 
  process.exit(1);
}

// Arguments
var host = process.argv[2],
    port = process.argv[3],
    prefix = process.argv[4] || '';

// Test neo4j instance
var neo = new Neode({host: host, port: port, prefix: prefix });

// Test'o'matic
require('./lib/testo');

// Let's roll
console.log("Testing:");

// #1 finding node
neo.findNode({nodeType: 'person', index: 'name', value: 'Johnny Depp' },
             function(node){
               testo.start('findNode');
               testo.notEqual(node, false, 'Did not find exactly one node'); 
               if (node) {
                 testo.equal(node.data.name, 'Johnny Depp', 'Node name is not equal Johnny Depp'); 
               } else {
                  testo.error('Did not find node');
               }
               testo.finish();
             });

// #2 creating node
neo.createNode({ '_type': 'person', name: 'Dirk Hagenbrecht' }, 
               function(node) {
                 testo.start('createNode');
                 testo.notEqual(node, false, 'Could not create node'); 
                 testo.notEqual(node, undefined, 'Could not create node');
                 if(node.data) {
                   testo.equal(node.data.name, 'Dirk Hagenbrecht', 'Node name is not Dirk Hagenbrecht');
                   testo.equal(node.data['_type'], 'person', 'Node has wrong type'); 
                 } else {
                   testo.errors("Did not receive node");                    
                 }
                 testo.finish();

// #3 Changing properties
                 node.data.name = "Hick";
                 neo.setNodeProperties(node, function(result) {
                   neo.findNode({ nodeType: 'person'
                                , index: 'name'
                                , value: 'Hick' }, function(updatedNode) {
                                   testo.start('updateNode');
                                   testo.equal(result, true, 'Could not update node');
                                   testo.notEqual(false, updatedNode, "Could not fetch node");
                                   if(updatedNode) {
                                    testo.equal(updatedNode.data.name, 'Hick', 'Name was not updated');
                                   } else {
                                     testo.error('Did not receive updated node');
                                   }
                                   testo.finish();
                                });
                 });
               }); 

// #4 Setting node properties of a non existant node
var randomName = ""+new Date();
var query = { index: 'name', nodeType: 'person', value: randomName };
var data  = { name: randomName };
neo.putNode(query, data, function(node, error) {
  testo.start("putNode (non existant node)");
  testo.notEqual(false, node, "Node was not created");
  testo.equal(randomName, node.data.name, "Node has wrong name");
  testo.finish();
}); 

// #5 Setting node properties of an existing node
var query = { index: 'name'
            , nodeType: 'person'
            , value: 'Dirk Hagenbrecht Junior'} 
neo.createNode({ '_type': 'person', name: 'Dirk Hagenbrecht Junior' }, 
  function(node) {
    neo.putNode({ index: 'name'
                , nodeType: 'person'
                , value: 'Dirk Hagenbrecht Junior'},
                {name: "Huck"},
                function(node) {
                  testo.start('putNode (existing node)');
                  testo.notEqual(false, node, "Could not update node");
                  testo.equal("Huck", node.data.name, "Name was not updated");
                  testo.finish();
    });
});

// #6 Creating relationships
var  from = {self: "http://"+host+":"+port+prefix+"/db/data/node/11" },
     to   = {self: "http://"+host+":"+port+prefix+"/db/data/node/1000001" };
     type = "test" + new Date();

neo.createRelationship(from, to, type, { payload: "loads" }, function(rel){
  testo.start('createRelationship');
  testo.notEqual(rel, false, 'Could not create relationship');
  if(rel.data) { testo.equal(rel.type, type, 'Wrong relationship type'); }
  if(rel.data) { testo.equal(rel.data.payload, 'loads', 'Wrong relationship type'); }
  testo.finish();

// #7 Get relationship
    neo.getRelationship(rel, function(fetched) {
      testo.start('getRelationship');
      testo.notEqual(fetched, false, 'Could not fetch relationship');
      testo.notEqual(fetched, undefined, 'Could not fetch relationship');
      if(fetched.data) {
        testo.equal(rel.data.payload, 'loads', 'Wrong relationship type');
      } else {
        testo.error('Did not receive relationship');
      }

      testo.finish();

// #8 Find relationships
      neo.findRelationships({from: from, to: to, type: type}, function(data) {
        testo.start('findRelationships');
        testo.notEqual(data, false, 'Could not find relationships');
        testo.notEqual(0, data.length, 'Could not find relationship');
        testo.equal(data[0].type, type, 'Did not find the right relationship');
        testo.finish();
        var rel = data[0];

// #9 Updating existing relationships
        var from = {self: rel.start},
        to   = {self: rel.end  }

        neo.putRelationship(from, to, rel.type, { payload: "palms" }, function(data, meta) {
          testo.start('putRelationship (existing)');
          testo.notEqual(data, false, 'Could not update relationship');
          if(data.data) {
            testo.equal(data.data.payload, 'palms', 'Did not update relationship');
          } else {
            testo.error('Could not update relationship');
          } 
          testo.finish();

// # 10 Updating new relationships
          neo.putRelationship(from, to, rel.type + "new", { payload: "palms" }, function(data, meta) {
            testo.start('putRelationship (new)');
            testo.notEqual(data, false, 'Could not update relationship');
            if(data.data) {
              testo.equal(data.data.payload, 'palms', 'Did not update relationship');
            } else {
              testo.error('Could not update relationship');
            } 
            testo.finish();
          });

        });
      });
    });

// #11 Removing from Index
neo.putNode({ index: 'original_title'
            , nodeType: 'movie'
            , value: 'The Matrix 5'},
            { original_title: "The Matrix 5"},
            function(node) {
              neo.removeFromNodeIndex('movie', node, 'original_title', function(i){
                testo.start('removeNodeIndex');

                testo.finish();
              }); 
              neo.addToNodeIndex('movie', node, 'original_title', function(i) {
                testo.start('addToNodeIndex');

                testo.finish();
              });
});
} );



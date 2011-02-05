# Neode
## neo4j rest adapter for node.js
Little node.js tryout. Provides easy access to many
resources of neo4j's rest api.

Don't use it yet. As a matter of fact, don't even look at
it yet! :)

## Tests
Should look something like this. Requires a prefilled
neo4j atm, so running the tests only make sense if you
do it on my laptop. Ha.

    homeboy ~/Dev/neode @master⌇ node test.js localhost 7474
    Testing:
     ● findNode
       .. ✓
     ● createNode
       .... ✓
     ● putNode (non existant node)
       .. ✓
     ● createRelationship
       ... ✓
     ● getRelationship
       ... ✓
     ● putNode (existing node)
       .. ✓
     ● findRelationships
       ... ✓
     ● updateNode
       .FF ✕
       1) Could not fetch node, did not expect 'false'
       2) Did not receive updated node
     ● addToNodeIndex
        ✓
     ● putRelationship (existing)
       .. ✓
     ● removeNodeIndex
        ✓
     ● putRelationship (new)
       .. ✓
    homeboy ~/Dev/neode @master⌇ 


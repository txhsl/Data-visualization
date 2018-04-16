d3.json("json/start_point.json", function(error, graph) {
    if (error) throw error;
  
    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("stroke-width", 2)
        .attr("style", function(d) {
            if (d.type == "act")
                return "stroke: " + color(1);
            else if (d.type == "direct")
                return "stroke: " + color(2);
            else if (d.type == "produce")
                return "stroke: " + color(3);
            else if (d.type == "write")
                return "stroke: " + color(4);
        });
  
    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("r", 15)
        .attr("fill", function(d) { return color(d.group); })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("dblclick", getData)
        .on("mouseenter", function() {
            d3.select(this).attr("r", 20);
        })
        .on("mousemove",  function() {
            d3.select(this).attr("r", 20);
        })
        .on("mouseout",  function() {
            d3.select(this).attr("r", 15);
        });

    var text = svg.append("g")
        .attr("class", "text")
        .selectAll("text")
        .data(graph.nodes)
        .enter()
        .append("text")
        .attr("dx",20)
        .attr("dy",10)
        .text(function(d){return d.name;});
  
    node.append("title")
        .text(function(d) { return d.id; });

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked)
        .force("link")
        .links(graph.links)
        .distance(function(d) {
            if (d.type == "act")
                return 250;
            else if (d.type == "direct")
                return 200;
            else if (d.type == "write")
                return 150;
            else if (d.type == "produce")
                return 100;
        });
  
    function ticked() {

      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
  
      node
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });

      text
          .attr("x", function(d){ return d.x; })
          .attr("y", function(d){ return d.y; });
    }

    function getData(d) {
        var temp_node = d3.select(this).data()[0];

        //deal with mongo
        var new_links = getLinks(temp_node);
        console.log(new_links);
        var new_nodes = getNodes(new_links, temp_node);
        console.log(new_nodes);
        if (new_links.length < 1)
            alert("No more relation to display!");

        //differ
        $.each(new_nodes, function (n, new_node) {
            var flag = true;
            for (var exist_node in graph.nodes) {
                if (graph.nodes[exist_node].id == new_node.id) {
                    flag = false;
                }
            }
            if (flag){
                graph.nodes.push(new_node);
            }
        });
        $.each(new_links, function (n, new_link) {
            var flag = true;
            for (var exist_link in graph.links) {
                if (graph.links[exist_link] == new_link.id) {
                    flag = false;
                }
            }
            if (flag){
                graph.links.push(new_link);
            }
        });

        updateSVG();
    }

    function updateSVG(){
        //update
        d3.selectAll("g")
            .selectAll("*")
            .remove();

        node = svg.selectAll("g.nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("r", 15)
        .attr("fill", function(d) { return color(d.group); })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("dblclick", getData)
        .on("mouseenter", function() {
            d3.select(this).attr("r", 20);
        })
        .on("mousemove",  function() {
            d3.select(this).attr("r", 20);
        })
        .on("mouseout",  function() {
            d3.select(this).attr("r", 15);
        });
 
        text = svg.selectAll("g.text")
            .selectAll("text")
            .data(graph.nodes)
            .enter()
            .append("text")
            .attr("dx",20)
            .attr("dy",10)
            .text(function(d){return d.name;});
  
        node.append("title")
            .text(function(d) { return d.id; });

        link = svg.selectAll("g.links")
            .selectAll("line")
            .data(graph.links)
            .enter()
            .append("line")
            .attr("stroke-width", 2)
            .attr("style", function(d) {
                if (d.type == "act")
                    return "stroke: " + color(1);
                else if (d.type == "direct")
                    return "stroke: " + color(2);
                else if (d.type == "produce")
                    return "stroke: " + color(3);
                else if (d.type == "write")
                    return "stroke: " + color(4);
            });

        link.append("text")
            .text(function(d) { return d.type; })
  
        simulation
            .nodes(graph.nodes)
            .on("tick", ticked)
            .force("link")
            .links(graph.links)
            .distance(function(d) {
                if (d.type == "act")
                    return 250;
                else if (d.type == "direct")
                    return 200;
                else if (d.type == "write")
                    return 150;
                else if (d.type == "produce")
                    return 100;
            }); 
    }

    function resetSVG() {
        graph.nodes = [];
        graph.links = [];

        var node_name = $()
        var node = { "_id": "sp", "id": node_name, "name": node_name, "group": 0};
        graph.nodes.push(node);

        getData(node);
        updateSVG();
    }

    function getNodes(links, node){
        var nodes = new Array();

        $.each(links, function (n, value) {
            nodes[n] = getNode(value, node);
        });
        return nodes;
    }

    function getNode(link, node) {
        var another_node = null;
        $.ajax({
            type: "get",
            url: "/nodes",
            data: { link: link, node: node },
            async: false,
            success: function(response){
                another_node = response[0];
            },
            error: function(error){
                alert(error);
            }
        });
        return another_node;
    }

    function getLinks(node) {
        var links = null;
        $.ajax({
            type: "get",
            url: "/links",
            data: { node: node },
            async: false,
            success: function(response){
                links = response;
            },
            error: function(error){
                alert(error);
            }
        });

        return links;
    }
  });
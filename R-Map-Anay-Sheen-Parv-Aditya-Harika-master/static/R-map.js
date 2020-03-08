function timeline(id){
  // set the dimensions and margins of the graph
  var margin = {top: 10, right: 30, bottom: 30, left: 50},
      width = 860 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3.select("acontent")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("class","timeline")
      .append("g")
      .attr("transform",
            "translate(" + (margin.left) + "," + (margin.top - 10) + ")");

  //Read the data
  d3.csv("http://10.218.108.201:5000/timeline?id="+id,

    function(d){
      return { tweet_id: d.tweet_id, created_at : d3.timeParse("%Y-%m-%d %H:%M:%S %p")(d.created_at)}
    },
    // Now I can use this dataset:
    function(data) {

      data = data.sort(function(a,b){
        return a.created_at - b.created_at;
      });

      var st = data[0]['created_at'];
      var en = d3.timeHour.offset(st, 2);
      var count = 0;
      t = []
      i = 0;
      j = 0;
      while(i < data.length){

        if(data[i]['created_at'] >= st && data[i]['created_at'] < en){
          count++;
        }
        else if (data[i]['created_at'] >= en){
          val = {};
          val['count'] = count;
          val['time'] = st;
          t.push(val)
          count = 0; j = j + 1;
          st = en;
          en = d3.timeHour.offset(st, 2);

          if(data[i]['created_at'] >= st && data[i]['created_at'] < en){
            count++;
          }
        } 
        
        i++;
      }

      data = t;
      var x = d3.scaleTime()
        .domain(d3.extent(data, function(d) { return d.time; }))
        .range([ 0, width ]);
      svg.append("g")
        .attr("transform", "translate(0," + (height+5) + ")")
        .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0));

      // Add Y axis
      var y = d3.scaleLinear()
        .domain( d3.extent(data, function(d) { return +d.count; }) )
        .range([ height, 0 ]);
      svg.append("g")
        .attr("transform", "translate(-5,0)")
        .call(d3.axisLeft(y).tickSizeOuter(0));

      // Add the area
      svg.append("path")
        .datum(data)
        .attr("fill", "#69b3a2")
        .attr("fill-opacity", .3)
        .attr("stroke", "none")
        .attr("d", d3.area()
          .x(function(d) { return x(d.time) })
          .y0( height )
          .y1(function(d) { return y(d.count) })
          )

      var tooltip = d3.select("acontent")
          .append("div")
          .style("position", "absolute")
          .style("border-radius", "10px")
          .style("z-index", "100")
          .style("color", "white")
          .style("opacity", "0.8")
          .style("text-align", "center")
          .style('white-space', 'pre')
          .style("background-color", "black")
          .style("font-size", "12px")
          .style("visibility", "hidden");


      // Add the line
      svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#69b3a2")
        .attr("stroke-width", 4)
        .attr("d", d3.line()
          .x(function(d) { return x(d.time) })
          .y(function(d) { return y(d.count) })
          )

      // Add the line
      svg.selectAll("myCircles")
        .data(data)
        .enter()
        .append("circle")
          .attr("fill", "red")
          .attr("stroke", "none")
          .attr("cx", function(d) { return x(d.time) })
          .attr("cy", function(d) { return y(d.count) })
          .attr("r", 5)
          .on("mouseover", function(d) {
          console.log(data)
            tooltip.transition()
                .duration(200)
            tooltip.style("visibility", "visible");
            tooltip.style("left", (d3.event.pageX -35) + "px")
                .style("top", (d3.event.pageY - 35) + "px");
            })
          .on("mousemove", function(d) {
            tooltip.transition()
                .duration(200)
            tooltip.style("visibility", "visible");
            tooltip.style("width",(d.length * 20) + 'px');
            tooltip.style("height","30px");
            tooltip.style("left", (d3.event.pageX -35) + "px")
                .style("top", (d3.event.pageY - 35) + "px");
            tooltip.html("Number of retweets: " + d.count);
            })
          .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
            tooltip.style("visibility", "hidden");})

      svg.append("text")
        .attr("x", (width / 2) - 150)
        .attr("y", 0 - (margin.top / 2) + 30)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("color","black")
        .style("text-decoration", "underline")
        .text("Timeline of Retweets");


  });
}

d3.json("http://10.218.108.201:5000/table", function(data){
  var data_table = data.map(function(x) {
    return {
      "Tweet ID": x[0],
      "Username": x[1],
      "Tweet": x[2],
      "Created At": x[3]
    };
  });

//Adding the Table Visualization
    var sortAscending = true;
    var table = d3.select('acontent').append('table');
    var titles = d3.keys(data_table[0]);
    var titles = ["Tweet ID", "Username", "Tweet", "Created At"]
    var headers = table.append('thead').append('tr')
      .selectAll('th')
      .data(titles).enter()
      .append('th')
      .text(function(d) {
        return d
      })
      .on('click', function(d) {
        headers.attr('class', 'header');
        if (d == "Username" || d == "Tweet") { //these keys sort alphabetically
          // sorting alphabetically");
          if (sortAscending) {
            rows.sort(function(a, b) {
              return d3.ascending(a[d], b[d]);
            });
            sortAscending = false;
            this.className = 'aes';
          } else {
            rows.sort(function(a, b) {
              return d3.descending(a[d], b[d]);
            });
            sortAscending = true;
            this.className = 'des';
          }
        } else {
          if (sortAscending) {
            //all other keys sort numerically including time
            rows.sort(function(a, b) {
              return b[d] - a[d];
            });
            sortAscending = false;
            this.className = 'aes';
          } else {
            rows.sort(function(a, b) {
              return a[d] - b[d];
            });
            sortAscending = true;
            this.className = 'des';
          }
        }
      });
    var rows = table.append('tbody').selectAll('tr')
      .data(data_table).enter()
      .append('tr')
      .on('click',function (d){
        save = d['Tweet ID'];
        d3.select('.wordcloud').remove();
        d3.select('.timeline').remove();
        d3.select('.rmap').remove();
        wordcloud(save);
        timeline(save);
        r_map(save);
      });
    rows.selectAll('td')
      .data(function(d) {
        return titles.map(function(key, i) {
          return {
            'value': d[key],
            'name': key
          };
        });
      }).enter()
      .append('td')
      .attr('data-th', function(d) {
        return d.name;
      })
      .text(function(d) {
          return d.value;
      });

});
//Word cloud for the most used words in the retweets
function wordcloud(id){
  var margin = {top: 30, right: 50, bottom: 30, left: 50};
  var width = 600 - margin.left - margin.right;
  var height = 550 - margin.top - margin.bottom;

  var svg = d3.select("acontent").append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("class","wordcloud");
  var g = svg.append("g")
             .attr("transform", "translate(" + (margin.left - 70) + "," + (margin.top - 80)  + ")");
  //Extracting the Data to construct the word cloud
  d3.json("http://10.218.108.201:5000/wordcloud?id="+id,function(data){
  var color = d3.scaleOrdinal(d3.schemeCategory20);
  var categories = d3.entries(data)
  var fontSizeScale = d3.scalePow().exponent(3).domain([0,1]).range([20,50]);
  var maxSize = d3.max(categories, function (d) {return +d.value;});
  var layout = d3.layout.cloud()
        .size([width, height])
        .timeInterval(20)
        .words(categories)
        .rotate(function(d) { return 0; })
        .fontSize(function(d,i) { return fontSizeScale(+d.value / maxSize); })
        .fontWeight(["bold"])
        .text(function(d) { return d.key; })
        .spiral("rectangular") 
        .on("end", draw)
        .start();
     //word cloud 
     var wordcloud = g.append("g")
        .attr('class','wordcloud')
        .attr("transform", "translate(" + width/2 + "," + height/2 + ")");
        
     g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .selectAll('text')
        .style('font-size','20px')
        .style('fill',function(d) { return color(d); })
        .style('font','sans-serif');

  function draw(words) {
      wordcloud.selectAll("text")
          .data(words)
          .enter().append("text")
          .attr('class','word')
          .style("fill", function(d, i) { return color(i); })
          .style("font-size", function(d) { return fontSizeScale(+d.value / maxSize) + "px"; })
          .style("font-family", function(d) { return 'sans-serif'; })
          .attr("text-anchor", "middle")
          .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
          .text(function(d) { return d.key; });
  };
    
  });
}
function r_map(id){
  //size of radius 
  var svg = d3.select("acontent").append("svg"),
      width = 1050,
      height = 600;

  svg.attr("width", width)
    .attr("height", height)
    .attr("class","rmap")

  var color = d3.scaleOrdinal(d3.schemeBlues[3]);
  //Constructing the Skeleton layout for the root and keyplayers
  var force_simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function(d) { return d.id; }))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

  //Extracting the Data of the root users and key players to construct the R-Map
  d3.json("http://10.218.108.201:5000/rmap?id=" + id, function(error, graph) {
     if (error) throw error;

    console.log(graph)
    var link = svg.append("g")
        .attr("class", "links")
      	.selectAll("line")
      	.data(graph.links)
      	.enter().append("line")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

    var voronoi = d3.voronoi().extent([[0,0], [width, height]]);

    var polygons = svg.append("g")
        .attr("class", "polygons")
      	.selectAll("polygon")
        .data(graph.nodes)
        .enter().append("polygon")
          .style("fill", function(d) { return color(d.group); })
          .style("fill-opacity", .2)
          .style("stroke", "black")
          .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
        
    var node = svg.append("g")
        .attr("class", "nodes")
      	.selectAll("circle")
      	.data(graph.nodes)
      	.enter().append("circle")
        .attr("r", 5)
        .attr("fill", function(d) { return color(d.group); })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("title")
        .text(function(d) { return d.id; });

    force_simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    force_simulation.force("link")
        .links(graph.links);

    function ticked() {
      if (graph.nodes[0].x) {
        var polygonShapes = voronoi(graph.nodes.map(function(d) {return [d.x, d.y]})).polygons()
        
        polygons.attr("points", function(d, i) {return polygonShapes[i]})
      }

      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    }
  });

  function dragstarted(d) {
    if (!d3.event.active) force_simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) force_simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}
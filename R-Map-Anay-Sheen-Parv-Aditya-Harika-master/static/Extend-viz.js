function piechart(id){
    d3.json("http://10.218.108.201:5000/pie?id="+ id, function(data){

        var keys = ['Positive', 'Neutral', 'Negative']
        var color = d3.scaleOrdinal()
        .domain(keys)
        .range(["#69B3A2","lightsteelblue", "#F65353"]),
            diameter = 500;
        //Adding the Bubble pack
        var bubble = d3.pack()
              .size([diameter, diameter])
              .padding(1.5),
            root = d3.hierarchy({children: data})
                .sum(function(d) { return d.children ? 0 : d3.sum(d[1]); }),
            arc = d3.arc().innerRadius(0),
            pie = d3.pie();
        //Adding Tooltip to the piechart
        var tooltip = d3.select("bcontent")
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

        var nodeData = bubble(root).children;

        var svg = d3.select("bcontent").append("svg")
            .attr("width", 600)
            .attr("height", 600)
            .attr("class", "bubble");

      var size = 20
      svg.selectAll("mydots")
        .data(keys)
        .enter()
        .append("rect")
        .attr("x", function(d,i) { return 100 + i*(size+100)})
        .attr("y", 10 + 500) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("width", size)
        .attr("height", size)
        .style("fill", function(d){ return color(d)})

       svg.selectAll("mylabels")
        .data(keys)
        .enter()
        .append("text")
        .attr("x", function(d,i){ return 100 + i*(size+100) + 30})
        .attr("y", size*1.2 + 500)
        .style("fill", "black")
        .text(function(d){ return d})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")

        var nodes = svg.selectAll("g.node")
                .data(nodeData);

        var nodeEnter = nodes.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + (d.x) + "," + (d.y) +")"; })
            .on("mouseover", function(d) {
              console.log(nodeData);
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
                tooltip.style("width",(d.length * 10) + 'px');
                tooltip.style("height","30px");
                tooltip.style("left", (d3.event.pageX -35) + "px")
                    .style("top", (d3.event.pageY - 35) + "px");
                tooltip.html("" + d.data[0]);
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                tooltip.style("visibility", "hidden");});

        var arcGs = nodeEnter.selectAll("g.arc")
            .data(function(d) {
              return pie(d.data[1]).map(function(m) { m.r = d.r; return m; });
            });
        var arcEnter = arcGs.enter().append("g").attr("class", "arc");

        arcEnter.append("path")
            .attr("d", function(d) {
              arc.outerRadius(d.r);
              return arc(d);
            })
            .style("fill", function(d, i) { return color(i); });

        arcEnter.append("text")
            .attr('x', function(d) { arc.outerRadius(d.r); return arc.centroid(d)[0]; })
                .attr('y', function(d) { arc.outerRadius(d.r); return arc.centroid(d)[1]; })
            .attr('dy', "0.35em")
            .style("text-anchor", "middle")
            .text(function(d) { //console.log(d);
            return d.value; });

        var labels = nodeEnter.selectAll("text.label")
            labels.enter()
            .append("text")
             .attr('class', 'label')
                .attr('dy', '0.35em')
            .style("text-anchor", "middle")
            .text(String);


    });
}

//Extracting the data of Root players for the table
d3.json("http://10.218.108.201:5000/table", function(data){
  var data_table = data.map(function(x) {
    return {
      "Tweet ID": x[0],
      "Username": x[1],
      "Tweet": x[2],
      "Created At": x[3]
    };
  });

  //Table Visualization 
    var sortAscending = true;
    var table = d3.select('bcontent').append('table');
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
        d3.selectAll('.bubble').remove();
        d3.selectAll('.wordcloudsenti').remove();
        piechart(save);
        wordcloud_senti(save);

      });
    rows.selectAll('td')
      .data(function(d) {
        return titles.map(function(key, i) {
          return {
            'value': d[key],
            'name': d
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
      funnel();
});
//Adding Funnel as the Extended Visualization 
function funnel() {
    var data =[[ 'BorisJohnson',2010],
                [ 'elonmusk',1534],
                [ 'RahulGandhi',1515],
                [ 'HillaryClinton',1214],
                ['jonasbrothers',1006],
                ['realDonaldTrump',1005],
                ['ArianaGrande',1003],
                ['KylieJenner',1002],
                ['taylorswift13',999],
                ['Cristiano',983],
               ['katyperry',775],
               ['jeremycorbyn',757],
               ['narendramodi',400],
               ['JimCarrey',385],
               ['TheEllenShow',312],
               ['justinbieber',309],
               ['shakira',308],
               ['JustinTrudeau',99],
                ['BernieSanders',0], 
               ['BarackObama',0 ] 
            ];
    var options = {
    chart:{
        width: 500,
        height: 600,
        bottomWidth: 1 / 2,
        bottomPinch: 0,
        isCurved: true,
        curveHeight: 1,
        fillType: "gradient",
        isInverted: false,
        hoverEffects: true,
        fontSize: '18px'
    }, block: {
    fill:{
    scale: d3.scaleSequential(d3.schemeOranges[20])
    }}
    };
    var funnel = new D3Funnel(data, options);
    funnel.draw("bcontent");
    $(window).on("resize", function () {
        var width = $("bcontent").width();
        options.width = width;
        var funnel = new D3Funnel(data, options);
        funnel.draw('bcontent');
    });
}

//Sentiment Analysis for the Word Cloud
function wordcloud_senti(id){
  var margin = {top: 30, right: 50, bottom: 30, left: 50};
  var width = 600 - margin.left - margin.right;
  var height = 550 - margin.top - margin.bottom;

  var g = d3.select("bcontent").append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("class","wordcloudsenti")
          .append("g")
          .attr("transform", "translate(" + (margin.left - 70) + "," + (margin.top - 80)  + ")");
  //Extracting the Data for Sentiment Analysis for the Word Cloud
  d3.json("http://10.218.108.201:5000/wordcloud_senti?id="+id,function(data){
  var color = d3.scaleOrdinal()
        .domain([0,3])
        .range(["#69B3A2","#F65353", "lightsteelblue"]);
  var categories = d3.entries(data);
  var fontSizeScale = d3.scalePow().exponent(3).domain([0,1]).range([20,50]);
  var maxSize = d3.max(categories, function (d) {return +d.value[0];});

  var layout = d3.layout.cloud()
        .size([width, height])
        .timeInterval(20)
        .words(categories)
        .rotate(function(d) { return 0; })
        .fontSize(function(d,i) { return fontSizeScale(+d.value[0] / maxSize); })
        .fontWeight(["bold"])
        .text(function(d) { return d.key; })
        .spiral("rectangular")
        .on("end", draw)
        .start();

     var wordcloud = g.append("g")
        .attr('class','wordcloud')
        .attr("transform", "translate(" + width/2 + "," + height/2 + ")");

     g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .selectAll('text')
        .style('font-size','20px')
        .style('fill',function(d) { return color(d.value[1]); })
        .style('font','sans-serif');

  function draw(words) {
      wordcloud.selectAll("text")
          .data(words)
          .enter().append("text")
          .attr('class','word')
          .style("fill", function(d, i) { return color(d.value[1]); })
          .style("font-size", function(d) { return fontSizeScale(+d.value[0] / maxSize) + "px"; })
          .style("font-family", function(d) { return 'sans-serif'; })
          .attr("text-anchor", "middle")
          .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
          .text(function(d) { return d.key; });
  };

  });
}
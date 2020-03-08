( function ( global ) {

  function D3Funnel ( data, options )
  {

    if ( !this._isArray ( data ) || data.length === 0 ||
      !this._isArray ( data [ 0 ] ) || data [ 0 ].length < 2 )
    {
      throw {
        name : "D3 Funnel Data Error",
        message : "Funnel initialization data is not valid."
      };
    }  // End if

    // Initialize options if not set
    options = typeof options !== "undefined" ? options : {};

    // Default configuration values
    var defaults = {
      width : 350,
      height : 400,
      bottomWidth : 1/3,
      bottomPinch : 0,
      isCurved : false,
      curveHeight : 20,
      fillType : "solid",
      isInverted : false,
      hoverEffects : false
    };
    var settings = defaults;
    var keys = Object.keys ( options );

    // Overwrite default settings with user options
    for ( var i = 0; i < keys.length; i++ )
    {
      settings [ keys [ i ] ] = options [ keys [ i ] ];
    }  // End for

    this.data = data;
    //var colorScale = d3.scale.category10();
    var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Initialize the colors
    for ( var i = 0; i < this.data.length; i++ )
    {

      var hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

      // If a color is not set for the record, add one
      if ( typeof this.data [ i ][ 2 ] === "undefined" ||
        !hex.test ( this.data [ i ][ 2 ] ) )
      {
        this.data [ i ][ 2 ] = colorScale ( i );
      }  // End if

    }  // End for

    // Initialize funnel chart settings
    this.width = settings.width;
    this.height = settings.height;
    this.bottomWidth = settings.width * settings.bottomWidth;
    this.bottomPinch = settings.bottomPinch;
    this.isCurved = settings.isCurved;
    this.curveHeight = settings.curveHeight;
    this.fillType = settings.fillType;
    this.isInverted = settings.isInverted;
    this.hoverEffects = settings.hoverEffects;
    this.bottomLeftX = ( this.width - this.bottomWidth ) / 2;
    this.dx = this.bottomPinch > 0 ?
      this.bottomLeftX / ( data.length - this.bottomPinch ) :
      this.bottomLeftX / data.length;
    this.dy = this.isCurved ?
      ( this.height - this.curveHeight ) / data.length :
      this.height / data.length;

  }  
  D3Funnel.prototype._isArray = function ( value )
  {

    return Object.prototype.toString.call ( value ) === "[object Array]";

  };  
  D3Funnel.prototype.draw = function ( selector )
  {

    // Remove any previous drawings
    d3.select ( selector ).selectAll ( "svg" ).remove ();

    // Add the SVG and group element
    var svg = d3.select ( selector )
      .append ( "svg" )
      .attr ( "width", this.width )
      .attr ( "height", this.height )
      .attr ( "class", "funnel")
      .append ( "g" );
    var group = {};
    var path = {};

    var sectionPaths = this._makePaths ();

    // Define color gradients
    if ( this.fillType === "gradient" )
    {
      this._defineColorGradients ( svg );
    }  // End if

    // Add top oval if curved
    if ( this.isCurved )
    {
      this._drawTopOval ( svg, sectionPaths );
    }  // End if

    // Add each block section
    for ( var i = 0; i < sectionPaths.length; i++ )
    {

      // Set the background color
      var fill = this.fillType !== "gradient" ?
         this.data [ i ][ 2 ] :
        "url(#gradient-" + i + ")";

      // Prepare data to assign to the section
      var data = {
        index : i,
        label : this.data [ i ][ 0 ],
        value : this.data [ i ][ 1 ],
        baseColor : this.data [ i ][ 2 ],
        fill : fill
      };

      // Construct path string
      var paths = sectionPaths [ i ];
      var pathStr = "";
      var path = [];

      // Iterate through each point
      for ( var j = 0; j < paths.length; j++ )
      {
        path = paths [ j ];
        pathStr += path [ 2 ] + path [ 0 ] + "," + path [ 1 ] + " ";
      }  // End for

      group = svg.append ( "g" );

      // Draw the sections's path and append the data
      path = group.append ( "path" )
        .attr("fill", fill)
                .attr("stroke", "#f5f0f0")//add white line to seperate each portion
                .attr("stroke-width", "2px")
        .attr ( "d", pathStr )
        .data([data]);

      // Add the hover events
      if ( this.hoverEffects )
      {
        path.on ( "mouseover", this._onMouseOver )
          .on ( "mouseout", this._onMouseOut );
      }  // End if

      // Add the section label
      var textStr = this.data [ i ][ 0 ] + ": " + this.data [ i ][ 1 ];
      var textX = this.width / 2;   // Center the text
      var textY = !this.isCurved ?  // Average height of bases
        ( this.dy * ( 2 * i + 1 ) ) / 2 :
        ( paths [ 1 ][ 1 ] + paths [ 3 ][ 1 ] ) / 2;

      group.append ( "text" )
        .text ( textStr )
        .attr ( "x" , textX)
        .attr("y" , textY)
        .attr("text-anchor" , "middle")
        .attr("dominant-baseline" , "middle")
        .attr("fill" , "#fff")
        .attr("pointer-events" , "none")
        .style ( "font-size", "14px" );

    }  // End for


  };  
  D3Funnel.prototype._makePaths = function ()
  {

    var paths = [];

    // Initialize velocity
    var dx = this.dx;
    var dy = this.dy;

    // Initialize starting positions
    var prevLeftX = 0;
    var prevRightX = this.width;
    var prevHeight = 0;

    // Start from the bottom for inverted
    if ( this.isInverted )
    {
      prevLeftX = this.bottomLeftX;
      prevRightX = this.width - this.bottomLeftX;
    }  // End if

    // Initialize next positions
    var nextLeftX = 0;
    var nextRightX = 0;
    var nextHeight = 0;

    var middle = this.width / 2;

    // Move down if there is an initial curve
    if ( this.isCurved )
    {
      prevHeight = 10;
    }  
    for ( var i = 0; i < this.data.length; i++ )
    {

      if ( this.bottomPinch > 0 )
      {

        if ( !this.isInverted )
        {
          if ( i >= this.data.length - this.bottomPinch )
          {
            dx = 0;
          }  // End if
        }
        
        else
        {
          dx = i < this.bottomPinch ? 0 : this.dx;
        }  // End if

      }  
      nextLeftX = prevLeftX + dx;
      nextRightX = prevRightX - dx;
      nextHeight = prevHeight + dy;
      if ( this.isInverted )
      {
        nextLeftX = prevLeftX - dx;
        nextRightX = prevRightX + dx;
      }  
      if ( this.isCurved )
      {

        paths.push ( [
          
          [ prevLeftX, prevHeight, "M" ],
          [ middle, prevHeight + ( this.curveHeight - 10 ), "Q" ],
          [ prevRightX, prevHeight, "" ],
          [ nextRightX, nextHeight, "L" ],
          [ nextRightX, nextHeight, "M" ],
          [ middle, nextHeight + this.curveHeight, "Q" ],
          [ nextLeftX, nextHeight, "" ],
          [ prevLeftX, prevHeight, "L" ]
        ] );

      }
      
      else
      {

        paths.push ( [
          
          [ prevLeftX, prevHeight, "M" ],
          [ prevRightX, prevHeight, "L" ],
          [ nextRightX, nextHeight, "L" ],
          [ nextLeftX, nextHeight, "L" ],
          [ prevLeftX, prevHeight, "L" ],
        ] );

      } 
      prevLeftX = nextLeftX;
      prevRightX = nextRightX;
      prevHeight = nextHeight;

    }  // End for

    return paths;

  };  
  D3Funnel.prototype._defineColorGradients = function ( svg )
  {

    var defs = svg.append ( "defs" );

    // Create a gradient for each section
    for ( var i = 0; i < this.data.length; i++ )
    {

      var color = this.data [ i ][ 2 ];
      var shade = add_color ( color, -0.25 );

      // Create linear gradient
      var gradient = defs.append("linearGradient")
        .attr("id", "gradient-" + i)
          .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r" , "50%")
        .attr("fx", "50%")
        .attr("fy", "50%");
        // );

      // Define the gradient stops
      var stops = [
        [ 0, shade ],
        [ 40, color ],
        [ 60, color ],
        [ 100, shade ]
      ];

      // Add the gradient stops
      for ( var j = 0; j < stops.length; j++ )
      {
        var stop = stops [ j ];
        gradient.append("stop")
                    .attr("offset" , stop [ 0 ] + "%")
          .attr("style" , "stop-color:" + stop [ 1 ] );
      }  // End for

    }  // End for

  };  
  D3Funnel.prototype._drawTopOval = function ( svg, sectionPaths )
  {

    var leftX = 0;
    var rightX = this.width;
    var centerX = this.width / 2;

    if ( this.isInverted )
    {
      leftX = this.bottomLeftX;
      rightX = this.width - this.bottomLeftX;
    }  
    var paths = sectionPaths [ 0 ];
    var path = "M" + leftX + "," + paths [ 0 ][ 1 ] +
      " Q" + centerX + "," + ( paths [ 1 ][ 1 ] + this.curveHeight - 10 ) +
      " " + rightX + "," + paths [ 2 ][ 1 ] +
      " M" + rightX + ",10" +
      " Q" + centerX + ",0" +
      " " + leftX + ",10";

    // Draw top oval
    svg.append ( "path" )
      .attr("fill", add_color(this.data[0][2], -0.4))
            .attr("d", path);

  };  // End _drawTopOval

  
  D3Funnel.prototype._onMouseOver = function ( data )
  {

    d3.select ( this ).attr ( "fill", add_color ( data.baseColor, -0.2 ) );

  };  // End _onMouseOver

  
  D3Funnel.prototype._onMouseOut = function ( data )
  {

    d3.select ( this ).attr ( "fill", data.fill );

  };  // End _onMouseOut

  
  function add_color ( color, shade )
  {

    var f = parseInt ( color.slice ( 1 ), 16 );
    var t = shade < 0 ? 0 : 255;
    var p = shade < 0 ? shade * -1 : shade;
    var R = f >> 16, G = f >> 8 & 0x00FF;
    var B = f & 0x0000FF;

    var converted = ( 0x1000000 + ( Math.round ( ( t - R ) * p ) + R ) *
      0x10000 + ( Math.round ( ( t - G ) * p ) + G ) *
      0x100 + ( Math.round ( ( t - B ) * p ) + B ) );

    return "#" + converted.toString ( 16 ).slice ( 1 );

  }  // End add_color

  global.D3Funnel = D3Funnel;

} )( this );
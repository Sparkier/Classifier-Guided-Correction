const d3 = require('d3');

var extra_bot_margin = 20;

export default function accuracy() {
  // Initialization Variables
  var margin = {
    top: 30,
    right: 40,
    bottom: 30,
    left: 70
  }
  var width = 440
  var height = width;
  var totalWidth = width + margin.left + margin.right;
  var totalHeight = height + margin.top + margin.bottom;

  // Scales in X and Y direction
  var x = d3.scaleLinear().range([0, width]);
  var y = d3.scaleLinear().range([height, 0]);

  // Get the Section where this belongs and add the SVG
  var svg_acuracy = d3.select('#accuracy')
    .append('svg')
    .attr('width', totalWidth)
    .attr('height', totalHeight + extra_bot_margin);

  // Rectangle for black Outline
  svg_acuracy.append('rect')
    .attr('width', totalWidth)
    .attr('height', totalHeight)
    .attr('fill', 'white')
    .attr('stroke', 'black')
    .attr('stroke-width', 1);

  // Main Group
  var acuracy_main = svg_acuracy.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // Bisector for Tooltip choosing the closer Value
  var bisectNumberLeft = d3.bisector(function(d) {
    return d.number;
  }).left;

  var line = d3.line()
    .x(function(d) {
      return x(d.number);
    })
    .y(function(d) {
      return y(d.accuracy);
    });

  // First CSV for the Test Data
  d3.csv('res/accuracy_test.csv', function(error, data1) {
    data1.forEach(function(d) {
      d.testAccuracy = +d.accuracy;
      d.testNumber = +d.number;
    });

    // Scale the range of the data
    x.domain(d3.extent(data1, function(d) {
      return d.testNumber;
    }));
    y.domain([0, d3.max(data1, function(d) {
      return d.testAccuracy;
    })]);

    // Add the valueline path.
    acuracy_main.append('path')
      .data([data1])
      .attr('class', 'line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#A32638')
      .attr('stroke-width', 2);

    // Add a Group for the first Tooltip
    var focusTest = acuracy_main.append('g')
      .attr('class', 'focusTest')
      .style('display', 'none');

    // Tooltip Circle Test
    focusTest.append('circle')
      .attr('r', 4);

    // Tooltip Text Test
    focusTest.append('text')
      .attr('x', 15)
      .attr('dy', '1.31em')
      .attr('fill', '#A32638');

    // Second CSV for the Train Data
    d3.csv('res/accuracy_train.csv', function(error, data2) {
      data2.forEach(function(d) {
        d.trainAccuracy = +d.accuracy;
        d.trainNumber = +d.number;
      });

      // Scale the range of the data
      x.domain(d3.extent(data2, function(d) {
        return d.trainNumber;
      }));
      y.domain([0, d3.max(data2, function(d) {
        return d.trainAccuracy;
      })]);

      // Add the valueline path.
      acuracy_main.append('path')
        .data([data2])
        .attr('class', 'line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2);

      // Add a Group for the second Tooltip
      var focusTrain = acuracy_main.append('g')
        .attr('class', 'focusTrain')
        .style('display', 'none');

      // Tooltip Circle Train
      focusTrain.append('circle')
        .attr('r', 4);

      // Tooltip Text Train
      focusTrain.append('text')
        .attr('x', 15)
        .attr('dy', '-.79em')
        .attr('fill', 'steelblue');

      // Rectangle for detecting Mouseovers
      svg_acuracy.append('rect')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', function() {
          focusTrain.style('display', null);
          focusTest.style('display', null);
        })
        .on('mouseout', function() {
          focusTrain.style('display', 'none');
          focusTest.style('display', 'none');
        })
        .on('mousemove', mousemove);

      // Handling the Mouse Move
      function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]),
          // Calculate Position of Train Tooltip
          i = bisectNumberLeft(data2, x0, 1),
          d0 = data2[i - 1],
          d1 = data2[i],
          d = x0 - d0.trainNumber > d1.trainNumber - x0 ? d1 : d0;
        // Set Tooltip Properties
        focusTrain.attr('transform', 'translate(' + x(d.trainNumber) + ',' + y(d.trainAccuracy) + ')');
        focusTrain.select('text').text(function() {
          return d.trainAccuracy;
        });

        // Calculate Position of Test Tooltip
        i = bisectNumberLeft(data1, x0, 1);
        d0 = data1[i - 1];
        d1 = data1[i];
        d = x0 - d0.testNumber > d1.testNumber - x0 ? d1 : d0;
        // Set Tooltip Properties
        focusTest.attr('transform', 'translate(' + x(d.testNumber) + ',' + y(d.testAccuracy) + ')');
        focusTest.select('text').html(function() {
          return d.testAccuracy;
        });
      }
    });

    // Legend
    acuracy_main.append('text')
      .attr('x', width - 120)
      .attr('y', height - 30)
      .text('Train-Accuracy')
      .attr('fill', 'steelblue')

    acuracy_main.append('text')
      .attr('x', width - 120)
      .attr('y', height - 10)
      .text('Test-Accuracy')
      .attr('fill', '#A32638')

    // Add the X Axis
    acuracy_main.append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x));

    // Add the Y Axis
    acuracy_main.append('g')
      .call(d3.axisLeft(y));
  });
};
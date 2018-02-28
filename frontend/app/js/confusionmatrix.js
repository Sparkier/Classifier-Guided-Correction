import $ from 'jquery';
const d3 = require('d3');

export default function confusionmatrix(dataset) {
	// Get the Classes from the text File that was used for training the labels
	d3.text('api/labels_txt/' + dataset, function(error, retrained_labels) {
		// Newline for each Label
		retrained_labels = retrained_labels.split('\n');
		var num_classes = retrained_labels.length;
		// Remove empty lines at the end of the file
		while (retrained_labels[num_classes - 1] == '') {
			retrained_labels.pop();
			num_classes--;
		}

		// Initialization Variables.
		var margin = {
			top: 70,
			right: 40,
			bottom: 35,
			left: 100
		};
		var buckets = [];
		var ssim_buckets = [];
		var in_label = [];
		var start_prob = 1.0 / num_classes;
		var chart_padding = 1;
		var max_images = 0;
		var score_wrong = 0;
		var prob_step_size = 0.1;

		// Main SVG Setup.
		var chartDiv = document.getElementById('confusionContainer');
		var svg_confusion = d3.select(chartDiv)
			                  .append('svg')

		// Initialize the buckets for later use.
		for (var i = 0; i < num_classes; i++) {
			// Add information about how many items are in each class for that Label.
			var classes = [];
			for (var j = 0; j < num_classes; j++) {
				buckets.push({
					label: i,
					class: j,
					num_images: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
					num_total: 0,
					score_wrong: 0.0
				});
				ssim_buckets.push({
					label: i,
					class: j,
					max_ssim: 0.0,
					avg_ssim: 0.0
				});
				if(i != j) {
					classes.push({
						class: j,
						number: 0
					});
				}
			}
			in_label.push({
				label: i,
				number: 0,
				classes: classes
			});
		}

		// Load the Image Classification Results.
		d3.tsv('api/train_csv/' + dataset, function(error, data) {
			// Convert all images and sort them into Buckets 
			data.forEach(function(d) {
				d.confirmed = +d.confirmed;
				// Only sort into Buckets if not already confirmed.
				if (!d.confirmed) {
					d.label = +d.label;
					d.class = +d.class;
					d.percentage = +d.percentage;
					var curr = buckets[d.class * num_classes + d.label];
					curr.num_images[Math.round(d.percentage * 10)]++;
					curr.num_total++;
					// Get the maximum number of images in one bar for the Bar Scale.
					max_images = curr.num_images[Math.round(d.percentage * 10)] > max_images ? 
					             Math.round(curr.num_images[Math.round(d.percentage * 10)]) : max_images;
					curr.score_wrong += d.percentage;

					// Update total number of Images for this Label.
					in_label[d.label].number++;
					if(d.label != d.class) {
						// Skip label == class
						var class_modified = (d.label <= d.class) ? d.class - 1 : d.class;
						// Update total number of Images per Class for this Label.
						in_label[d.label].classes[class_modified].number++;
					}
				}
			});

			in_label.sort(function(a, b) {
				return parseFloat(b.number) - parseFloat(a.number);
			});
			for (var i = 0; i < in_label.length; i++) {
				in_label[i].classes.sort(function(a, b) {
					return parseFloat(b.number) - parseFloat(a.number);
				});
			}

			// Get the Maximal score_wrong for the color scaling.
			for (var i = 0; i < buckets.length; i++) {
				if (buckets[i].class != buckets[i].label) {
					score_wrong = (buckets[i].score_wrong > score_wrong) ? 
					              buckets[i].score_wrong : score_wrong;
				}
			}

			// Draw for the first time to initialize.
			get_ssim();
		});

		function get_ssim() {
			// Load SSIM Results
			d3.tsv('api/ssim_csv/' + dataset, function(error, data) {
				data.forEach(function(d) {
					d.label = +d.label;
					d.class = +d.class;
					d.max_ssim = +d.max_ssim;
					d.avg_ssim = +d.avg_ssim;
					ssim_buckets[d.label * num_classes + d.class].max_ssim = d.max_ssim;
					ssim_buckets[d.label * num_classes + d.class].avg_ssim = d.avg_ssim;
				});
				redraw();
			});
		}

		function redraw() {
			// Extract the width and height that was computed by CSS.
			var width = chartDiv.clientWidth;
			var height = chartDiv.clientHeight;
			// Initialize the SVG.
			svg_confusion
				.attr('width', width)
				.attr('height', height);
			// Get the Dimensions for the Main Group.
			var main_dims = {
				main_width: width - margin.left - margin.right,
				main_height: height - margin.top - margin.bottom
			};
			// Initialize the Main Group
			var confusion_main = svg_confusion.append('g')
				.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
				.attr("width", main_dims.main_width)
				.attr("height", main_dims.main_height);
			// Calculate Chart properties.
			var total_chart_height = (main_dims.main_height - ((num_classes) * chart_padding)) / num_classes;
			var total_chart_width = (main_dims.main_width - ((num_classes - 1) * chart_padding)) /
			                        (num_classes - 1);

			// Scale on x-Axis for the Bars.
			var x_scale_trainclass = d3.scaleLog().domain([0.1, max_images]).range([0, total_chart_width]);
			// Color Scale for the Cells.
			var color_scale = d3.scaleLog().domain([(score_wrong * 0.1), score_wrong]).range([0, 100]);
			// Properties of the Matrix.
			var num_rects = (1.0 - start_prob) / 0.1 + 1;
			var rect_height = total_chart_height / num_rects;
			// Scale on y Axis for Cell positions.
			var area_scale_y = d3.scaleLinear().domain([start_prob, 1.0]).range([total_chart_height - 
				                                                                rect_height, 0.0]);

			// Add Cells for each Bucket
			for (var i = 0; i < num_classes; i++) {
				for (var j = 0; j < num_classes - 1; j++) {
					// Display Buckets sorted by total number of Items.
					var label_number = in_label[i].label;
					// Modify j so that label == class is not displayed.
					var class_number = in_label[i].classes[j].class

					// Check for SSIM
					var ssim_indicator = false;
					if (ssim_buckets[class_number * num_classes + label_number].max_ssim > 0.95) {
						ssim_indicator = true;
					}

					// Get the Current Bucket with its properties.
					var buck = buckets[class_number * num_classes + label_number];
					var color = 'hsl(0, 60%, 50%)';
					var value = (buck.num_total == 0) ? 80 : 60;
					// Only saturate when at least 0.1*score_wrong.
					var saturation = 0;
					if(buck.num_total >= (score_wrong * 0.1)) {
						saturation = color_scale(buck.score_wrong);
					}

					// Append a Rect for the Cell.
					confusion_main.append('rect')
						.attr('x', (j * (total_chart_width + chart_padding) + (chart_padding / 2)))
						.attr('y', (i * (total_chart_height + chart_padding) + (chart_padding / 2)))
						.attr('width', total_chart_width)
						.attr('height', total_chart_height)
						.style('fill', 'hsl(238, ' + saturation + '%, ' + value + '%)')
						.attr('opacity', '0.5');

					// Add bars to the Rect.
					for (var k = parseInt((start_prob * 10)); k < 11; k++) {
						confusion_main.append('rect')
							// Calcualte the Position of the Rect
							.attr('x', (j * (total_chart_width + chart_padding) + (chart_padding / 2)))
							.attr('y', area_scale_y(parseFloat(k)/10.0) +
								(i * (total_chart_height + chart_padding) + 
								(chart_padding / 2)))
							.attr('width', x_scale_trainclass(buck.num_images[k]))
							.attr('height', rect_height)
							.attr('fill', color);
					}

					// Add SSIM Indicators where appropriate.
					if (ssim_indicator) {
						var dim = Math.min(total_chart_width, total_chart_height)
						confusion_main.append('svg:image')
							.attr('xlink:href', 'api/icon/duplicates.png')
							.attr('x', (j * (total_chart_width + chart_padding) + (chart_padding / 2) + 
							           ((total_chart_width - dim)/2)))
							.attr('y', (i * (total_chart_height + chart_padding) + (chart_padding / 2) + 
							           ((total_chart_height - dim)/2)))
							.attr('width', dim)
							.attr('height', dim);
					}

					// Add Hyperrefs linking to the Detail View
					confusion_main.append('a')
						.attr("xlink:href", 'trainclass.html?label=' + label_number + '&class=' + class_number)
						.append('rect')
						.attr('x', (j * (total_chart_width + chart_padding) + (chart_padding / 2)))
						.attr('y', (i * (total_chart_height + chart_padding) + (chart_padding / 2)))
						.attr('width', total_chart_width)
						.attr('height', total_chart_height)
						.style('fill', 'transparent')
						.on('mouseover', handleMouseOver)
						.on('mouseout', handleMouseOut);

					// Add Text displaying the Classification Result.
					confusion_main.append('text')
						.text(retrained_labels[class_number])
						.style('text_anchor', 'middle')
						.attr('transform', 'translate('+ (((j + 1) * (total_chart_width + chart_padding)) - 
											(chart_padding/2) - (total_chart_width/2)) +
											','+ 
											((i + 1) * (total_chart_height + chart_padding) - chart_padding) 
											+')');
				}
				// Diagram Axes for each Class and Diagram Heading.
				// Add the Label Name
				var t = svg_confusion.append('text')
					.text(retrained_labels[label_number])
					.style("text-anchor", "middle")
					.attr('transform', 'translate('+ (margin.left/2) +','+ (margin.top + ((i + 1) * 
										(total_chart_height + chart_padding)) - (chart_padding/2) - 
										(total_chart_height/2)) +')');
			}
			
			// Visual sparation of Text and Diagram
			// Vertical Separation Line
			svg_confusion.append("line")
				.attr("x1", margin.left)
				.attr("x2", margin.left)
				.attr("y1", 0)
				.attr("y2", main_dims.main_height + margin.top)
				.attr("stroke-width", 2)
				.attr("stroke", "black");
			// Horizontal Separation Line
			svg_confusion.append("line")
				.attr("x1", 0)
				.attr("x2", main_dims.main_width + margin.left)
				.attr("y1", margin.top)
				.attr("y2", margin.top)
				.attr("stroke-width", 2)
				.attr("stroke", "black");
			// Top Left Diagonal Line
			svg_confusion.append("line")
				.attr("x1", 5)
				.attr("x2", margin.left)
				.attr("y1", 10)
				.attr("y2", margin.top)
				.attr("stroke-width", 1)
				.attr("stroke", "black");
			// Human Label
			svg_confusion.append('text')
				.text('Human')
				.attr('transform', 'translate(' + 5 + ',' + (margin.top - 5) + ')')
				.style("font-size", "18px");
			// Computer Label
			svg_confusion.append('text')
				.text('Computer')
				.style("text-anchor", "end")
				.attr('transform', 'translate(' + (margin.left - 5) + ',' + 15 + ')')
				.style("font-size", "18px");
			// Rect for hiding top area of Numbers.
			svg_confusion.append('rect')
				.attr('x', 0)
				.attr('y', margin.top + 1)
				.attr('width', margin.left - 1)
				.attr('height', 0)
				.style('fill', 'white')
				.attr('class', 'overlayLeftTop')
				.attr('opacity', '0.8');
			// Rect for hiding Bottom Area of Numbers.
			svg_confusion.append('rect')
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', margin.left - 1)
				.attr('height', 0)
				.style('fill', 'white')
				.attr('class', 'overlayLeftBottom')
				.attr('opacity', '0.8');;

			// Called when User hovers over a Cell.
			function handleMouseOver(d, i) {
				// Hide other Numbers
				var current = d3.select(this);
				d3.select('.overlayLeftTop')
					.attr('height', current.attr('y') - 1);
				d3.select('.overlayLeftBottom')
					.attr('y', (parseInt(current.attr('y')) + parseInt(current.attr('height')) + margin.top))
					.attr('height', (main_dims.main_height - parseInt(current.attr('y')) - 
							parseInt(current.attr('height'))));
			}
			
			// Called when Mouse is not over a Cell anymore.
			function handleMouseOut(d, i) {
				// Show all Numbers
				d3.select('.overlayLeftTop')
					.attr('height', 0);
				d3.select('.overlayLeftBottom')
					.attr('y', 0)
					.attr('height', 0);
			}
		}
	});
};
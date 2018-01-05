import $ from 'jquery';
const d3 = require('d3');

export default function trainclass(dataset) {
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

		/***********************************************************
	  	  Start: Initialization Variables
		***********************************************************/
		var margin = {
			top: 70,
			right: 40,
			bottom: 35,
			left: 100
		};
		var buckets = [];
		var ssim_buckets = [];
		var start_prob = 1.0 / num_classes;
		var chart_padding = 1;
		var max_images = 0;
		var score_wrong = 0;
		var prob_step_size = 0.1;
		/***********************************************************
		  End: Initialization Variables
		***********************************************************/

		// Load the Image Classification Results
		d3.tsv('api/train_csv/' + dataset, function(error, data) {
			for (var i = 0; i < num_classes; i++) {
				for (var j = 0; j < num_classes; j++) {
					buckets.push({
						class: i,
						num_images: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
						label: j,
						num_total: 0,
						score_wrong: 0.0
					});
				}
			}

			/***********************************************************
			  Start: Convert all images and sort them into Buckets
			***********************************************************/  
			data.forEach(function(d) {
				d.label = +d.label;
				d.class = +d.class;
				d.percentage = +d.percentage;
				d.confirmed = +d.confirmed;

				if (!d.confirmed) {
					var curr = buckets[d.label * num_classes + d.class];
					curr.num_images[Math.round(d.percentage * 10)]++;
					curr.num_total++;
					max_images = curr.num_images[Math.round(d.percentage * 10)] > max_images ? Math.round(curr.num_images[Math.round(d.percentage * 10)]) : max_images;
					curr.score_wrong += d.percentage;
				}
			});
			/***********************************************************
			  End: Convert all images and sort them into Buckets
			***********************************************************/

			for (var i = 0; i < buckets.length; i++) {
				if (buckets[i].class != buckets[i].label) {
					score_wrong = (buckets[i].score_wrong > score_wrong) ? buckets[i].score_wrong : score_wrong;
				}
			}

			// Draw for the first time to initialize.
			get_ssim();
		});

		/***********************************************************
		  Start: Main SVG Setup
		***********************************************************/
		var chartDiv = document.getElementById('confusionContainer');
		var svg_confusion = d3.select(chartDiv)
			.append('svg')
		/***********************************************************
		  End: Main SVG Setup
		***********************************************************/

		function get_ssim() {
			// Load SSIM Results
			d3.tsv('api/ssim_csv/' + dataset, function(error, data) {
				for (var i = 0; i < num_classes; i++) {
					for (var j = 0; j < num_classes; j++) {
						ssim_buckets.push({
							class: i,
							label: j,
							max_ssim: 0.0,
							avg_ssim: 0.0
						});
					}
				}
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
			svg_confusion
				.attr('width', width)
				.attr('height', height);
			var main_dims = {
				main_width: width - margin.left - margin.right,
				main_height: height - margin.top - margin.bottom
			};
			var confusion_main = svg_confusion.append('g')
				.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
			confusion_main
				.attr("width", main_dims.main_width)
				.attr("height", main_dims.main_height);
			var total_chart_height = (main_dims.main_height - ((num_classes) * chart_padding)) / num_classes;
			var total_chart_width = (main_dims.main_width - ((num_classes) * chart_padding)) / num_classes;

			/***********************************************************
			  Start: Scales
			***********************************************************/
			// Scales in Y direction, make sure to optimize scale to number of classes
			var x_scale_trainclass = d3.scaleLog().domain([0.1, max_images]).range([0, total_chart_width]);
			var color_scale = d3.scaleLog().domain([(score_wrong * 0.1), score_wrong]).range([0, 100]);
			// Scales for Area Functions
			var num_rects = (1.0 - start_prob) / 0.1 + 1;
			var rect_height = total_chart_height / num_rects;
			var area_scale_y = d3.scaleLinear().domain([start_prob, 1.0]).range([total_chart_height - rect_height, 0.0]);
			/***********************************************************
			  End: Scales
			***********************************************************/

			/***********************************************************
        	  Start: Add a Rect for each Bucket
      		***********************************************************/
			for (var i = 0; i < num_classes; i++) {
				for (var j = 0; j < num_classes; j++) {
					// Check for SSIM
					var ssim_indicator = false;
					if (ssim_buckets[i * num_classes + j].max_ssim > 0.95) {
						ssim_indicator = true;
					}

					var buck = buckets[i * num_classes + j];
					var bucks = [];
					var correct = (buck.label == buck.class);
					var color = correct ? 'hsl(115, 60%, 25%)' : 'hsl(0, 60%, 50%)';
					var value = (buck.num_total == 0) ? 80 : 60;
					var saturation = 0;
					if(!correct && (buck.num_total >= (score_wrong * 0.1))) {
						saturation = color_scale(buck.score_wrong);
					}

					confusion_main.append('rect')
						.attr('x', (buck.label * (total_chart_width + chart_padding) + (chart_padding / 2)))
						.attr('y', (buck.class * (total_chart_height + chart_padding) + (chart_padding / 2)))
						.attr('width', total_chart_width)
						.attr('height', total_chart_height)
						.style('fill', 'hsl(238, ' + saturation + '%, ' + value + '%)')
						.attr('opacity', '0.5');

					for (var k = parseInt((start_prob * 10)); k < 11; k++) {
						confusion_main.append('rect')
							// Calcualte the Position of the Rect
							.attr('x', (buck.label * (total_chart_width + chart_padding) + (chart_padding / 2)))
							.attr('y', area_scale_y(parseFloat(k)/10.0) + (buck.class * (total_chart_height + chart_padding) + (chart_padding / 2)))
							.attr('width', x_scale_trainclass(buck.num_images[k]))
							.attr('height', rect_height)
							.attr('fill', color);
					}

					if (ssim_indicator) {
						var dim = Math.min(total_chart_width, total_chart_height)
						confusion_main.append('svg:image')
							.attr('xlink:href', 'api/image/other/all/duplicates/duplicates.png')
							.attr('x', (buck.label * (total_chart_width + chart_padding) + (chart_padding / 2) + ((total_chart_width - dim)/2)))
							.attr('y', (buck.class * (total_chart_height + chart_padding) + (chart_padding / 2) + ((total_chart_height - dim)/2)))
							.attr('width', dim)
							.attr('height', dim);
					}

					confusion_main.append('a')
						.attr("xlink:href", 'trainclass.html?label=' + i + '&class=' + j)
						.append('rect')
						.attr('x', (buck.label * (total_chart_width + chart_padding) + (chart_padding / 2)))
						.attr('y', (buck.class * (total_chart_height + chart_padding) + (chart_padding / 2)))
						.attr('width', total_chart_width)
						.attr('height', total_chart_height)
						.style('fill', 'transparent');
				}
			}
			/***********************************************************
			  End: Add a Rect for each Bucket
			***********************************************************/

			/***********************************************************
			  Start: Diagram Axes for each Class and Diagram Heading
			***********************************************************/
			for (var i = 0; i < num_classes; i++) {
				// Add the Label Name
				var t = svg_confusion.append('text')
					.text(retrained_labels[i])
					.style("text-anchor", "middle")
					.attr('transform', 'translate('+ (margin.left/2) +','+ (margin.top + ((i + 1) * (total_chart_height + chart_padding)) - (chart_padding/2) - (total_chart_height/2)) +')');
				// Add the Class Name
				svg_confusion.append('text')
					.text(retrained_labels[i])
					.attr('transform', 'translate('+ (margin.left + ((i + 1) * (total_chart_width + chart_padding)) - (chart_padding/2) - (total_chart_width/2)) +','+ 65 +'), rotate(-30)');
			}
			/***********************************************************
			  End: Diagram Axes for each Class and Diagram Heading
			***********************************************************/
			
			/***********************************************************
			  Start: Sparation of Text and Diagram
			***********************************************************/
			svg_confusion.append("line")
				.attr("x1", margin.left)
				.attr("x2", margin.left)
				.attr("y1", 0)
				.attr("y2", main_dims.main_height + margin.top)
				.attr("stroke-width", 2)
				.attr("stroke", "black");
			svg_confusion.append("line")
				.attr("x1", 0)
				.attr("x2", main_dims.main_width + margin.left)
				.attr("y1", margin.top)
				.attr("y2", margin.top)
				.attr("stroke-width", 2)
				.attr("stroke", "black");
			svg_confusion.append("line")
				.attr("x1", 5)
				.attr("x2", margin.left)
				.attr("y1", 10)
				.attr("y2", margin.top)
				.attr("stroke-width", 1)
				.attr("stroke", "black");
			svg_confusion.append('text')
				.text('Human')
				.attr('transform', 'translate(' + 5 + ',' + (margin.top - 5) + ')')
				.style("font-size", "18px");
			svg_confusion.append('text')
				.text('Computer')
				.style("text-anchor", "end")
				.attr('transform', 'translate(' + (margin.left - 5) + ',' + 15 + ')')
				.style("font-size", "18px");
			/***********************************************************
			  End: Sparation of Text and Diagram
			***********************************************************/
		}
	});
};
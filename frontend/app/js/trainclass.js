import {
	load_images,
	load_images_SSIM,
	append
} from './images'
import $ from 'jquery';
const d3 = require('d3');

export default function trainclass(dataset, label, classification) {
	// Get the Classes from the text File that was used for training the labels
	d3.text('api/labels_txt/' + dataset, function(error, retrained_labels) {
		var correct = false;
		if (label == classification) {
			correct = true;
		}
		// Newline for each Label
		retrained_labels = retrained_labels.split('\n');
		var num_classes = retrained_labels.length;
		// Remove empty lines at the end of the file
		while (retrained_labels[num_classes - 1] == '') {
			retrained_labels.pop();
			num_classes--;
		}

		// Set the text of the Classification Heading
		document.getElementById("classHeading").innerHTML = 'Human: ' + retrained_labels[label] + ' Computer: ' + retrained_labels[classification];

		/***********************************************************
			Start: Initialization Variables
		***********************************************************/
		var margin = {
			top: 0,
			right: 20,
			bottom: 35,
			left: 70
		};

		var myNode = document.getElementById('imContainer');
		var width = myNode.clientWidth;
		var rect_size = {
			width: 12,
			height: 12
		};
		var start_prob = 1.0 / num_classes;
		var prob_step_size = 0.1;
		// Total Height of one Chart
		var total_chart_height = ((1.0 - start_prob) / prob_step_size + 1) * (rect_size.height) + (2 * ((1.0 - start_prob) / prob_step_size));
		var chart_padding = 50;
		var height = total_chart_height;
		var totalWidth = width + margin.left + margin.right;
		var totalHeight = height + margin.top + margin.bottom;
		var all_images = []
		var allImgs = 0;
		var prev_images = [];
		var buckets = [];
		/***********************************************************
			End: Initialization Variables
		***********************************************************/

		/***********************************************************
			Start: Main SVG Setup
		***********************************************************/
		var svg_trainclass = d3.select('#trainclassContainer')
			.append('svg')
			.attr('width', totalWidth)
			.attr('height', totalHeight);

		// Main Group for this SVG
		var trainclass_main = svg_trainclass.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
		/***********************************************************
			End: Main SVG Setup
		***********************************************************/

		// Load the Image Classification Results
		d3.tsv('api/train_csv/' + dataset, function(error, data) {
			// Convert all Items  
			data.forEach(function(d) {
				// image,label,class,percentage
				d.image = +d.image;
				d.label = +d.label;
				d.class = +d.class;
				if(d.label == label && d.class == classification) {
					d.percentage = +d.percentage;
					d.name = d.name;
					d.probabilities = JSON.parse(d.probabilities);
					d.confirmed = +d.confirmed;
					d.distance_saliency_hue = +d.distance_saliency_hue;
					d.tsne_saliency = JSON.parse(d.tsne_saliency);
					var correct_class = (d.label == d.class) ? true : false

					/***********************************************************
						Start: Sort Images into Buckets
					***********************************************************/
					if (d.label == label && d.class == classification && !d.confirmed) {
						allImgs++;
						all_images.push(d);
						var bucket_exists = false;
						// Go over all Buckets
						for (var i = 0; i < buckets.length; i++) {
							// Check if there already is a bucket for this image
							if (buckets[i].percentage == d.percentage.toFixed(1) && buckets[i].correct_class == correct_class && buckets[i].class == d.class) {
								// Add the image to the existing bucket
								buckets[i].images.push(d);
								buckets[i].num_images = buckets[i].num_images + 1;
								bucket_exists = true;
							}
						}
						// Create a new Bucket if none exists for the image 
						if (bucket_exists == false) {
							// Set the buckets variables
							buckets.push({
								percentage: d.percentage.toFixed(1),
								images: [d],
								correct_class: correct_class,
								class: d.class,
								num_images: 1
							});
						}
					}
				}
				/***********************************************************
					End: Sort Images into Buckets
				***********************************************************/
			});

			/***********************************************************
				Start: Scales
			***********************************************************/
			// Get maximum Number of Images for log Scale in x Direction
			var max_images = 0;
			for (var i = 0; i < buckets.length; i++) {
				max_images = (buckets[i].num_images > max_images) ? buckets[i].num_images : max_images;
			}

			// Scales in Y direction, make sure to optimize scale to number of classes
			var x_scale_trainclass = d3.scaleLog().domain([0.1, max_images]).range([0, width]);
			var y_tick_strings = [];
			for (var i = 0; i < ((1.0 - start_prob) / prob_step_size + 1); i++) {
				y_tick_strings.push('[' + (Math.round(Math.max(start_prob, ((prob_step_size * i) - (prob_step_size / 2) + start_prob)) * 100) / 100).toFixed(2) + ', ' + (Math.round(Math.min(1.0, ((prob_step_size * (i + 1.0)) - (prob_step_size / 2) + start_prob)) * 100) / 100).toFixed(2) + ']');
			}
			var y_scale_trainclass = d3.scaleBand().domain(y_tick_strings).range([total_chart_height, 0]);
			/***********************************************************
				End: Scales
			***********************************************************/

			/***********************************************************
				Start: Add a Rect and Text for each Bucket
			***********************************************************/
			var barSelection = trainclass_main.selectAll('bar')
				.data(buckets)
				.enter()

			barSelection.append('rect')
				// Calcualte the Position of the Rect
				.attr('x', 0)
				.attr('y', function(d) {
					var y_step = ((1.0 - start_prob) / prob_step_size) - ((d.percentage - start_prob) / prob_step_size);
					return y_step * (rect_size.height + 2);
				})
				.attr('width', function(d) {
					return x_scale_trainclass(d.num_images);
				})
				.attr('height', rect_size.height)
				// Set Classification, Label and Percentage Variables
				.attr('classification', function(d) {
					return (d.class);
				})
				.attr('correct_class', function(d) {
					return d.correct_class;
				})
				.attr('percentage', function(d) {
					return d.percentage;
				})
				// Make the Rect Selectable
				.attr('class', function(d) {
					return (d.correct_class) ? 'selectable falsely' : 'selectable correctly';
				})
				// Listen for Clicks onto the Rect
				.on('click', function(d, i) {
					// Check if already selected
					var e = d3.event,
						isSelected = d3.select(this).classed('selected');

					// Handle multi-selection
					if (!e.ctrlKey) {
						d3.selectAll('rect.selected').classed('selected', false);
					}

					// Select or deselect
					d3.select(this).classed('selected', !isSelected);

					// Look for all Images that have to get displayed
					check_images(all_images, prev_images, allImgs, buckets, correct);
				});


			barSelection.append('text')
				.attr('x', 5)
				.attr('y', function(d) {
					var y_step = ((1.0 - start_prob) / prob_step_size) - ((d.percentage - start_prob) / prob_step_size);
					return y_step * (rect_size.height + 2) + 11;
				})
				.text(function(d) {
					return d.num_images;
				})
				.style("font-size", "12px")
				.style("pointer-events", "none");
			/***********************************************************
				End: Add a Rect and Text for each Bucket
			***********************************************************/

			/***********************************************************
				Start: Diagram Axes for each Class and Diagram Heading
			***********************************************************/
			// Y-Axis
			trainclass_main.append('g')
				.attr('transform', 'translate(' + 0 + ',' + 0 + ')')
				.call(d3.axisLeft(y_scale_trainclass));

			//X-Axis
			var numberFormat = d3.format("d");

			function logFormat(d) {
				var x = Math.log(d) / Math.log(10) + 1e-6;
				return (Math.abs(x - Math.floor(x)) < .4 && (d > 0.5 || d < 0.2)) ? numberFormat(d) : "";
			}

			trainclass_main.append('g')
				.attr('transform', 'translate(' + 0 + ',' + total_chart_height + ')')
				.call(d3.axisBottom(x_scale_trainclass).ticks(0).tickSizeOuter(0));

			// Add the Class Name
			trainclass_main.append('text')
				.attr('x', 0)
				.attr('y', ((i * (total_chart_height + chart_padding)) - 5))
				.text(retrained_labels[i]);
			/***********************************************************
				End: Diagram Axes for each Class and Diagram Heading
			***********************************************************/

			// Load SSIM Results
			d3.tsv('api/class_ssim_csv/' + dataset + '/' + label + '/' + classification, function(error, data) {
				
				var ssim = []; 
				data.forEach(function(d) {
					d.label = +d.label;
					d.class = +d.class;
					d.image1 = d.image1;
					d.image2 = d.image2;
					d.ssim = +d.ssim;
					ssim.push([d.label, d.class, d.image1, d.image2, d.ssim])
				});
				// Load Images for SSIM View
				load_images_SSIM(dataset, ssim, all_images);
			});

			// Check images once at beginning
			check_images(all_images, prev_images, allImgs, buckets, correct);
		});
	});

	/**
		Check, which images have to be displayed 
	**/
	function check_images(all_images, prev_images, allImgs, buckets, correct) {
		// Get all the selected rects
		var images = [];
		var image_number = 0;
		var selected = d3.selectAll('rect.selected');
		// If there are selected ones, display only these
		if (!selected.empty()) {
			selected.each(function(state_data, i) {
				// Get the current image and Classification
				var curr = d3.select(this),
					curr_class = curr.attr('classification'),
					correct_class = (curr.attr('correct_class') == 'true'),
					curr_percentage = curr.attr('percentage');

				// Add each bucket that was selected
				for (var i = 0; i < buckets.length; i++) {
					// Select only the correct buckets dependant on class and percentage
					if (curr_class == buckets[i].class && correct_class == buckets[i].correct_class && curr_percentage == buckets[i].percentage) {
						// Add each image in the bucket to the path list
						images = images.concat(buckets[i].images)
						image_number += buckets[i].num_images;
					}
				}
			});
			// If the image set has changed, reload the images
			if (prev_images != images) {
				load_images(dataset, images, image_number, correct);
				prev_images = images;
			}
		} else {
			load_images(dataset, all_images, allImgs, correct);
			prev_images = all_images;
		}
	}
};
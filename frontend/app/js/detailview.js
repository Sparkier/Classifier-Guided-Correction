import $ from 'jquery';
import * as browserStore from 'storejs';

const d3 = require('d3');
var x_scale_trainclass;
var detail_main;
var button_size = {
	width: 460,
	height: 30
};
var width = 0;
var total_width = 0;
var height = 0;
var total_height = 0;
var bar_padding = 5;
var chart_padding = 40;
var labels;
var dataloc;
var lbl;
var cls;
var total_chart_height;
var participant_id;
var margin = {
	top: 10,
	right: 20,
	bottom: 10,
	left: 20
};
var probs = [];
var class_size = {
	width: 460,
	height: 12
};

export default function detailview(dataset, label, classification) {
	var loader = document.getElementById('loader');
	loader.style.display = "none";
	// Standart Setup
	dataloc = dataset;
	lbl = label;
	cls = classification;
	participant_id = browserStore.get('participant_id');
	if(participant_id === undefined) {
        $.ajax({
            method: 'GET',
            url: '/api/participant_id/' + dataset
        }).done((data) => {
            browserStore.set('participant_id', data.participant_id);
        });
    }
	
	// Get Width of Container, Height will be calculated.
	var myNode = document.getElementById('detailContainer');
	total_width = myNode.clientWidth;

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
		labels = retrained_labels;

		for (var i = 0; i < num_classes; i++) {
			probs.push(0.0);
		}
		
		// Initialization Variables
		var start_prob = 1.0 / num_classes;
		var prob_step_size = 0.1;
		total_chart_height = (num_classes * class_size.height + 30);

		height = 4 * (button_size.height + bar_padding);
		width = total_width - margin.left - margin.right;
		total_height = Math.max(height + margin.top + margin.bottom + total_chart_height + chart_padding, myNode.clientHeight - 10);

		// Main SVG
		var svg_detail = d3.select('#detailContainer')
			.append('svg')
			.attr('width', total_width)
			.attr('height', total_height);

		// Main Group for this SVG
		detail_main = svg_detail.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
			.attr("width", width)
			.attr("height", height);
	});
};

export function update_data(probabilities, paths) {
	// Update the Selected Number of Items
	var myNode = document.getElementById('span');
	myNode.innerHTML = paths.length + ' Selected';
	if(paths.length > 0) {
		document.getElementById('detailImage').src = 'api/image/' + dataloc + '/' + paths[0];	
	} else {
		document.getElementById('detailImage').src = 'api/icon/placeholder.jpg';
	}

	detail_main.selectAll('.buttonrect').remove();
	detail_main.selectAll('.buttontext').remove();
	detail_main.selectAll('.desctext').remove();
	detail_main.selectAll('.text').remove();
	detail_main.selectAll('.buttoninvis').remove();
	detail_main.selectAll(".axis").remove();
	detail_main.selectAll(".rectdiag").remove();

	// Add the four Buttons
	var texts = [];
	var desc = [];
	if(paths.length > 0 ) {
		texts = [
			'Label ' + lbl + ' Correct',
			'Label ' + cls + ' Correct',
			'Other Label Correct',
			'Delete Items'
		];

		// Visible Buttons
		detail_main.selectAll('.buttonrect')
			.data(texts)
			.enter()
			.append('rect')
			.attr('x', 0)
			.attr('y', function(d, i) {
				if(i == 3) {
					return total_height - margin.bottom - button_size.height - 10;
				} else {
					return (button_size.height * i) + (bar_padding * i);
				}
			})
			.attr('height', button_size.height)
			.attr('width', button_size.width)
			.attr('fill', function(d, i) {
				return 'darkgrey'
			})
			.attr('class', 'buttonrect');

		// Text for Class Label and Probability Value
		detail_main.selectAll('.buttontext')
			.data(texts)
			.enter()
			.append('text')
			.style('text-anchor', 'middle')
			.style('fill', 'white')
			.text(function(d, i) {
				return texts[i];
			})
			.attr('transform', function(d, i) {
				if(i == 3) {
					return 'translate('+ (button_size.width/2) +','+ (total_height - margin.bottom - 18) +')';
				} else {
					return 'translate('+ (button_size.width/2) +','+ ((button_size.height * (i+1)) + (bar_padding * i) - 8) +')';
				}
			})
			.attr('class', 'buttontext');

		// Invisible Rect for handling Click Events
		detail_main.selectAll('.buttoninvis')
			.data(texts)
			.enter()
			.append('rect')
			.on('click', function(d, i) {
				if (i == 0) {
					if (confirm("Confirm the Label?") == true) {
						confirm_images(paths);
					}
				} else if (i == 1) {
					if (confirm("Label these images as "+cls+"?") == true) {
						relabel_images(paths);
					}
				} else if (i == 2) {
					var popup = document.getElementById('popup');
					var select = document.getElementById('labelBox');
					var cancel = document.getElementById('cancel');
					var confirmbtn = document.getElementById('submit');

					for(var item in labels) {
						var opt = document.createElement('option');
            			opt.value = labels[item];
            			opt.innerHTML = labels[item];
            			select.appendChild(opt);
					}
					
					popup.style.display = "block";
					cancel.onclick = function() {
						popup.style.display = "none";
					}
					confirmbtn.onclick = function() {
						var value = select.value;
						relabel(paths, value)
						popup.style.display = "none";
					}
				} else if (i == 3) {
					if (confirm("Delete these Images?") == true) {
						remove(paths);
					}
				}
			})
			.attr("class", "buttoninvis")
			.attr('x', 0)
			.attr('y', function(d, i) {
				if(i == 3) {
					return total_height - margin.bottom - button_size.height - 10;
				} else {
					return (button_size.height * i) + (bar_padding * i);
				}
			})
			.attr('height', button_size.height)
			.attr('width', button_size.width)
			.attr('fill', 'transparent');

		// Fill the probability array
		for (var i = 0; i < probs.length; i++) {
			probs[i] = 0.0;
		}
		for (var i = 0; i < probabilities.length; i++) {
			for (var j = 0; j <  probs.length; j++) {
				probs[j] = probs[j] + probabilities[i][j];
			}
		}
		for (var j = 0; j <  probs.length; j++) {
			probs[j] = probs[j] / probabilities.length;	
		}
		
		// Add bars to diagram
		x_scale_trainclass = d3.scaleLinear().domain([0.0, 1.0]).range([0.0, class_size.width - 40]);
		var y_tick_strings = [];
		for (var i = 0; i < labels.length; i++) {
			y_tick_strings.push(labels[i]);
		}
		var y_scale_trainclass = d3.scaleBand().domain(y_tick_strings).range([total_chart_height, 0]);
		var y_scale_trainclass2 = d3.scaleLinear().domain([0, labels.length]).range([0, total_chart_height]);
		var y_shift = (3 * (button_size.height + bar_padding)) + 40;
		var axis = d3.axisLeft(y_scale_trainclass)

		// Visible bars indicating class probabilities
		detail_main.selectAll('.rectdiag')
			.data(probs)
			.attr('width', function(d) {
				return isNaN(x_scale_trainclass(d)) ? 0 : x_scale_trainclass(d);
			}) 
			.enter()
			.append('rect')
			.attr('x', 30)
			.attr('y', function(d, i) {
				return (total_chart_height - y_scale_trainclass2(i)) + y_shift - class_size.height;
			})
			.attr('width', function(d) {
				return isNaN(x_scale_trainclass(d)) ? 0 : x_scale_trainclass(d);
			}) 
			.attr('height', class_size.height)
			.attr('fill', '#A32638')
			.attr('class', 'rectdiag')

		// Text for the Diagram
		detail_main.append('text')
			.text('Score Distribution')
			.attr('transform', function(d, i) {
				return 'translate('+ 20 +','+ (y_shift - 10) +')';
			})
			.attr('class', 'desctext')
			.attr('font-size', '12px');

		// Y-Axis
		detail_main.append('g')
			.attr('transform', 'translate(' + 30 + ',' + y_shift + ')')
			.attr('class', 'axis')
			.call(d3.axisLeft(y_scale_trainclass));
		
		detail_main.append('g')
			.attr('transform', 'translate(' + 30 + ',' + (y_shift + total_chart_height) + ')')
			.attr('class', 'axis')
			.call(d3.axisBottom(x_scale_trainclass));
	}
};

function relabel_images(paths) {	
	var loader = document.getElementById('loader');
	loader.style.display = "flex";
	$.ajax({
		method: 'POST',
		url: '/api/relabel_images/' + dataloc + '/' + participant_id + '/' + lbl + '/' + cls,
		data: {
			arr: paths
		},
		success: function(data){
			location.reload();
		}
	});
};

function confirm_images(paths) {
	var loader = document.getElementById('loader');
	loader.style.display = "flex";
	$.ajax({
		method: 'POST',
		url: '/api/confirm_images/' + dataloc + '/' + participant_id + '/' + lbl + '/' + cls,
		data: {
			arr: paths
		},
		success: function(data){
			location.reload();
		}
	});
};

function remove(paths) {
	var loader = document.getElementById('loader');
	loader.style.display = "flex";
	$.ajax({
		method: 'POST',
		url: '/api/delete_images/' + dataloc + '/' + participant_id + '/' + lbl + '/' + cls,
		data: {
			arr: paths
		},
		success: function(data){
			location.reload();
		}
	});
}
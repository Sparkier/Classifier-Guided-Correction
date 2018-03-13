import $ from 'jquery';
import * as browserStore from 'storejs';

const d3 = require('d3');
var probs = [];
var x_scale_trainclass;
var detail_main;
var class_size = {
			width: 12,
			height: 20
		};
var width = 510;
var bar_padding = 5;
var labels;
var dataloc;
var lbl;
var cls;
var participant_id;

export default function detailview(dataset, label, classification) {
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
		labels.push('');

		for (var i = 0; i < num_classes; i++) {
			probs.push(0.0);
		}
		probs.push(-1.0);
		
		/***********************************************************
    	  Start: Initialization Variables
	    ***********************************************************/
		var margin = {
			top: 0,
			right: 20,
			bottom: 35,
			left: 0
		};

		var start_prob = 1.0 / num_classes;
		var prob_step_size = 0.1;
		// Total Height of one Chart
		var total_chart_height = (num_classes * class_size.height) + (bar_padding * num_classes);
		var chart_padding = 50;
		var height = total_chart_height;
		var totalWidth = width + margin.left + margin.right;
		var totalHeight = height + margin.top + margin.bottom;
		var allPaths = [];
		var allImgs = 0;
		var prevPaths = [];
		var buckets = [];
		/***********************************************************
		  End: Initialization Variables
		***********************************************************/

		/***********************************************************
     	  Start: Main SVG Setup
    	***********************************************************/
		var svg_detail = d3.select('#detailContainer')
			.append('svg')
			.attr('width', totalWidth)
			.attr('height', totalHeight);

		// Main Group for this SVG
		detail_main = svg_detail.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
		/***********************************************************
		  End: Main SVG Setup
		***********************************************************/
	});
};

export function update_data(probabilities, paths) {
	if(paths.length > 0) {
		document.getElementById('detailImage').src = 'api/image/' + dataloc + '/' + paths[0];	
		if(paths.length == 1) {
			document.getElementById('detailHeading').innerHTML = 'Change or Confirm ' + paths.length + ' Label';
		} else {
			document.getElementById('detailHeading').innerHTML = 'Change or Confirm ' + paths.length + ' Labels';
		}
	} else {
		document.getElementById('detailImage').src = 'api/icon/placeholder.jpg';
		document.getElementById('detailHeading').innerHTML = 'Change or Confirm Labels';
	}
	
	/***********************************************************
      Start: Fill the probability array
    ***********************************************************/
	for (var i = 0; i < probs.length-1; i++) {
		probs[i] = 0.0;
	}
	for (var i = 0; i < probabilities.length; i++) {
		for (var j = 0; j <  probs.length-1; j++) {
			probs[j] = probs[j] + probabilities[i][j];
		}
	}
	for (var j = 0; j <  probs.length-1; j++) {
		probs[j] = probs[j] / probabilities.length;	
	}
	/***********************************************************
      End: Fill the probability array
    ***********************************************************/

    /***********************************************************
      Start: Add bars and text to DetailView
    ***********************************************************/
	// Scale for visible Bars
	x_scale_trainclass = d3.scaleLinear().domain([0.0, 1.0]).range([0.0, width]);

	// Visible bars indicating class probabilities
	detail_main.selectAll('rect')
		.data(probs.slice(0, -1))
		.attr('width', function(d) {
			return isNaN(x_scale_trainclass(d)) ? 0 : x_scale_trainclass(d);
		}) 
		.enter()
		.append('rect')
		.attr('x', 0)
		.attr('y', function(d, i) {
			return (class_size.height * i) + (bar_padding * i);
		})
		.attr('width', function(d) {
			return isNaN(x_scale_trainclass(d)) ? 0 : x_scale_trainclass(d);
		}) 
		.attr('height', class_size.height)
		.attr('fill', 'hsl(238, 100%, 80%)')
		.exit()
		.remove();

	// Text for Class Label and Probability Value
	detail_main.selectAll('text')
		.data(labels)
		.text(function(d, i) {
			if (isNaN(probs[i])) {
				return ('');
			} else if (i == labels.length-1) {
				if (isNaN(probs[0])) {
					return '';
				} else {
					return ('Remove Items from Dataset');
				}
			} else {
				return (d + ': ' + (probs[i].toFixed(2)) + '%');
			}
		})
		.enter()
		.append('text')
		.text(function(d, i) {
			if (isNaN(probs[i])) {
				return ('');
			} else if (i == labels.length-1) {
				if (isNaN(probs[0])) {
					return '';
				} else {
					return ('Remove Items from Dataset');
				}
			} else {
				return (d + ': ' + (probs[i].toFixed(2)) + '%');
			}
		})
		.attr('transform', function(d, i) {
			return 'translate('+ 5 +','+ ((class_size.height * (i+1)) + (bar_padding * i) - 4) +')';
		})
		.exit()
		.remove();

	// Invisible Rect for handling Click Events
	detail_main.selectAll('.rect_invis')
		.data(probs)
		.on('click', function(d, i) {
			if(paths.length > 0) {
				if (i == labels.length-1) {
					if (confirm("Remove these images from the Dataset?") == true) {
					   remove(paths);
				  }
				} else {
					if (confirm("Label these images as "+labels[i]+" and remove them from this Visualization?") == true) {
					   relabel(paths, i);
				  }
				}
			}
        })
		.enter()
		.append('rect')
		.attr("class", "rect_invis")
		.attr('x', 0)
		.attr('y', function(d, i) {
			return (class_size.height * i) + (bar_padding * i);
		})
		.attr('width', x_scale_trainclass(1.0)) 
		.attr('height', class_size.height)
		.attr('fill', 'transparent')
		.exit()
		.remove();
	/***********************************************************
      End: Add bars and text to DetailView
    ***********************************************************/
};

function relabel(paths, new_label) {
	// Load the Image Classification Results
	d3.tsv('api/train_csv/' + dataloc + '/' +  participant_id, function(error, data) {
		/***********************************************************
		  Start: Convert all images
		***********************************************************/
		images = [];
		data.forEach(function(d) {
			d.image = +d.image;
			d.label = +d.label;
			d.class = +d.class;
			d.percentage = +d.percentage;
          	d.name = d.name;
          	d.probabilities = d.probabilities;
          	d.confirmed = +d.confirmed;
          	var probs = JSON.parse(d.probabilities);
          	for (var i = 0; i < paths.length; i++) {
          		if(paths[i] == d.name) {
          			d.label = new_label;
          			d.percentage = probs[new_label];
          			d.confirmed = 1;
          		}
          	}
          	images.push(d);
		});

		var json = JSON.stringify(images);
		var xhttp = new XMLHttpRequest();
  		xhttp.open("POST", "api/modify_csv/" + dataloc + '/' + lbl + '/' + cls + '/' + participant_id);
  		xhttp.setRequestHeader("Content-Type", "application/json");
  		xhttp.onreadystatechange = function() {//Call a function when the state changes.
    		if(xhttp.readyState == 4 && xhttp.status == 204) {
				location.reload(); 
    		}
		}
  		xhttp.send(json);
		/***********************************************************
		  End: Convert all images
		***********************************************************/
	});
};

function remove(paths) {
	// Load the Image Classification Results
	d3.tsv('api/train_csv/' + dataloc + '/' +  participant_id, function(error, data) {
		/***********************************************************
		  Start: Convert all images
		***********************************************************/
		images = [];
		data.forEach(function(d) {
			d.image = +d.image;
			d.label = +d.label;
			d.class = +d.class;
			d.percentage = +d.percentage;
          	d.name = d.name;
          	d.probabilities = d.probabilities;
          	d.confirmed = +d.confirmed;
          	var probs = JSON.parse(d.probabilities);
          	for (var i = 0; i < paths.length; i++) {
          		if(paths[i] == d.name) {
          			d.confirmed = 2;
          		}
          	}
          	images.push(d);
		});

		var json = JSON.stringify(images);
		var xhttp = new XMLHttpRequest();
  		xhttp.open("POST", "api/modify_delete/" + dataloc + '/' + lbl + '/' + cls + '/' + participant_id);
  		xhttp.setRequestHeader("Content-Type", "application/json");
  		xhttp.onreadystatechange = function() {//Call a function when the state changes.
    		if(xhttp.readyState == 4 && xhttp.status == 204) {
				location.reload(); 
    		}
		}
  		xhttp.send(json);
		/***********************************************************
		  End: Convert all images
		***********************************************************/
	});
}
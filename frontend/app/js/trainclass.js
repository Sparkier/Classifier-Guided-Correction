import {
	load_images,
	load_images_SSIM,
	append
} from './images'
import $ from 'jquery';
const d3 = require('d3');
import * as browserStore from 'storejs';
import * as slider from 'ion-rangeslider'

export default function trainclass(dataset, label, classification) {
	var participant_id = browserStore.get('participant_id');
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
		var all_images = []
		var allImgs = 0;
		var min = 0.0;
		var max = 1.0;
		/***********************************************************
			End: Initialization Variables
		***********************************************************/

		// Load the Image Classification Results
		d3.tsv('api/train_csv/' + dataset + '/' + participant_id + '?' + Math.floor(Math.random() * 10000), function(error, data) {
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

					// Add all unconfirmed Images
					if (!d.confirmed) {
						allImgs++;
						all_images.push(d);
					}
				}
			});

			// Load SSIM Results
			d3.tsv('api/class_ssim_csv/' + dataset + '/' + label + '/' + classification + '?' + Math.floor(Math.random() * 10000), function(error, data) {
				
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
			check_images(all_images, allImgs, correct, min, max);

			var comboBox = document.getElementById("comboBox")
			comboBox.onchange = function(){
				check_images(all_images, allImgs, correct, min, max);
			};

			// Init the Range Slider
			$("#range").ionRangeSlider({
				type: "double",
				min: 0,
				max: 1,
				from: 0,
				to: 1,
				step: 0.01,
				onFinish: function (data) {
					min = data.from;
					max = data.to;
					check_images(all_images, allImgs, correct, min, max);
				}
			});
		});
	});

	/**
		Check, which images have to be displayed 
	**/
	function check_images(all_images, allImgs, correct, min, max) {
		// Get all the selected rects
		var images = [];
		var image_number = 0;
		if(min != 0.0 || max != 1.0) {
			for(var image in all_images) {
				var curr = all_images[image];
				if(curr.percentage <= max && curr.percentage >= min) {
					images.push(curr);
					image_number = image_number + 1;
				}
			}
			load_images(dataset, images, image_number, correct);
		} else {			
			load_images(dataset, all_images, allImgs, correct);
		}
	}
};
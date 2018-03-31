import {
  update_data
} from './detailview'
import "fabric";

var canvas;
var canvas_ssim;
var selected_paths = [];
var selected_probs = [];

export function load_images(dataset, images, num_images, correct) {
  // Create the Canvas Element
  var newCanvas = document.createElement("canvas");
  var myNode = document.getElementById('imContainer');
  var comboBox = document.getElementById("comboBox")
  var mode = comboBox.selectedIndex;
  
  // Remove previous Canvas
  if(myNode.hasChildNodes()) {
    myNode.removeChild(myNode.lastChild);
  }
  
  // Calculate Canvas Basics
  var width = myNode.clientWidth - 15;
  var height = myNode.clientHeight - 60;
  
  if (mode == 0 && images.length > 5 && !correct) {
    var dims = Math.min(width, height);

    // t-SNE
    // Add the Canvas and Configure it
    myNode.appendChild(newCanvas);
    canvas = new fabric.Canvas(newCanvas, {
      width: width,
      height: height
    });
    configureCanvas();

    // Create a List of all Images
    for (var i = 0; i < images.length; i++) {
      appendTSNE(dataset, images[i], dims, width, height);
    }
  } else {
    // No t-SNE
    var num_per_line = Math.floor(width / 32);
    var num_lines = Math.ceil(images.length / num_per_line + 1);
    var num_per_line_quadr = Math.ceil(Math.sqrt(images.length));
    var num_lines_quadr = images.length / num_per_line_quadr;

    // Sort the images
    images.sort(function(a, b) {
      switch (mode) {
        case 1:
          return parseFloat(b.percentage) - parseFloat(a.percentage);
      }
    });

    console.log((num_lines_quadr * 32));
    console.log(height);
    if((num_lines_quadr * 32) > height) {
      // Add the Canvas and Configure it
      myNode.appendChild(newCanvas);
      canvas = new fabric.Canvas(newCanvas, {
        width: width,
        height: num_lines * 32
      });
      configureCanvas();

      // Create a List of all Images
      for (var i = 0; i < images.length; i++) {
        append(dataset, images[i], i, num_per_line);
      }
    } else{
      // Add the Canvas and Configure it
      myNode.appendChild(newCanvas);
      canvas = new fabric.Canvas(newCanvas, {
        width: width,
        height: height
      });
      configureCanvas();
      var imgs_width = num_per_line_quadr * 32;
      var imgs_height = num_lines_quadr * 32;

      var start_x = (width / 2) - (imgs_width / 2);
      var start_y = (height / 2) - (imgs_height / 2);

      for(var i = 0; i < images.length; i++) {
        appendQuadratic(dataset, images[i], i, start_x, start_y, num_per_line_quadr);
      }
    }
  }

  // Init the Detail View with no Data
  update_data(selected_probs, selected_paths);
}

export function load_images_SSIM(dataset, ssim, all_images, same) {
  // Create the Canvas Element
  var newCanvas = document.createElement("canvas");
  var myNode = document.getElementById('ssimContainer');

  // Remove previous Canvas
  if(myNode.childElementCount == 2) {
    myNode.removeChild(myNode.lastChild);
  }

  // Calculate Canvas Basics
  var width = myNode.clientWidth;
  var height = 40;

  // Add the Canvas and Configure it
  myNode.appendChild(newCanvas);
  canvas_ssim = new fabric.Canvas(newCanvas, {
    width: width,
    height: height
  });
  configureCanvas();

  // Sort the images
  ssim.sort(function(a, b) {
    return parseFloat(b[4]) - parseFloat(a[4]);
  });

  var num_pairs = Math.floor(width / 80);
  var pairs = ssim.slice(0, num_pairs);

  // Once a pair has been skipped, this offset comes into play.
  var i_offset = 0;
  var appended = false;
  // Add as many pairs as fitting into view.
  for (var i = 0; i < num_pairs; i++) {
    var found_images = [];
    // Add two images for each pair.
    for (var j = 0; j < 2; j++) {
      for (var k = 0; k < all_images.length; k++) {
        if (ssim[i][j+2] == all_images[k].name) {
          // When the images was found, add it.
          found_images.push(all_images[k]);
        }
      }
    }
    // Check if both images were found.
    if(found_images.length == 2) {
      // Add them to the view.
      for (var j = 0; j < found_images.length; j++) {
        appended = true;
        appendSSIM(dataset, found_images[j], i - i_offset, j);
      }
    } else {
      // Check if list exceeded
      if(num_pairs > ssim.length) {
        num_pairs = 0;
      } else {
        // Go further (a pair has been skipped).
        num_pairs = num_pairs + 1;
        i_offset = i_offset + 1;
      }
    }
  }
  if(!appended && same) {
    window.history.back();
  }
}

// Appending all the images to the View
function append(dataset, image, number, num_per_line) {
  var line = Math.floor(number / num_per_line);
  var in_line = number % num_per_line;
  
  var im = new fabric.Image.fromURL('api/image/' + dataset + '/' + image.name, function(oImg) { 
    oImg.set({'left':32*in_line,
              'top':32*line});
    if(!image.name.includes('train')) {
      oImg.set({
        'stroke': 'blue',
        'strokeWidth': 2
      })
    }
    oImg.scaleToWidth(28);
    oImg.scaleToHeight(28);
    oImg.on('selected', function() {
      selected_paths.push(image.name);
      selected_probs.push(image.probabilities);
      update_data(selected_probs, selected_paths);
    });
    oImg.on('deselected', function() {
      var index = selected_paths.indexOf(image.name);
      selected_paths.splice(index, 1);
      selected_probs.splice(index, 1);
      update_data(selected_probs, selected_paths);
    });
    canvas.add(oImg);
  });
}

function appendQuadratic(dataset, image, number, start_x, start_y, num_per_line) {
  var line = Math.floor(number / num_per_line);
  var in_line = number % num_per_line;

  var im = new fabric.Image.fromURL('api/image/' + dataset + '/' + image.name, function(oImg) { 
    oImg.set({'left':(start_x + 32*in_line),
              'top':(start_y + 32*line)});
    if(!image.name.includes('train')) {
      oImg.set({
        'stroke': 'blue',
        'strokeWidth': 2
      })
    }
    oImg.scaleToWidth(28);
    oImg.scaleToHeight(28);
    oImg.on('selected', function() {
      selected_paths.push(image.name);
      selected_probs.push(image.probabilities);
      update_data(selected_probs, selected_paths);
    });
    oImg.on('deselected', function() {
      var index = selected_paths.indexOf(image.name);
      selected_paths.splice(index, 1);
      selected_probs.splice(index, 1);
      update_data(selected_probs, selected_paths);
    });
    canvas.add(oImg);
  });
}

function appendTSNE(dataset, image, dims, width, height) {
  var pos_X = 0.0;
  var pos_Y = 0.0;
  pos_X = image.tsne_saliency[0];
  pos_Y = image.tsne_saliency[1];
  pos_X = ((pos_X + 1.0)  / 2.0) * (dims-32) + ((width-dims)/2);
  pos_Y = ((pos_Y + 1.0)  / 2.0) * (dims-32) + ((height-dims)/2);
  var im = new fabric.Image.fromURL('api/image/' + dataset + '/' + image.name, function(oImg) { 
    oImg.set({'left':pos_X,
              'top':pos_Y});
    if(!image.name.includes('train')) {
      oImg.set({
        'stroke': 'blue',
        'strokeWidth': 2
      })
    }
    oImg.scaleToWidth(28);
    oImg.scaleToHeight(28);
    oImg.on('selected', function() {
      selected_paths.push(image.name);
      selected_probs.push(image.probabilities);
      update_data(selected_probs, selected_paths);
    });
    oImg.on('deselected', function() {
      var index = selected_paths.indexOf(image.name);
      selected_paths.splice(index, 1);
      selected_probs.splice(index, 1);
      update_data(selected_probs, selected_paths);
    });
    canvas.add(oImg);
  });
}

function appendSSIM(dataset, image, n_pair, n_image) {
  var pos_pair_x = n_pair * 80;

  var im = new fabric.Image.fromURL('api/image/' + dataset + '/' + image.name, function(oImg) {
    oImg.set({
      'left': (pos_pair_x + 10 + (n_image * 32)),
      'top': 0
    });
    if (!image.name.includes('train')) {
      oImg.set({
        'stroke': 'blue',
        'strokeWidth': 2
      })
    }
    oImg.scaleToWidth(28);
    oImg.scaleToHeight(28);
    oImg.on('selected', function() {
      selected_paths.push(image.name);
      selected_probs.push(image.probabilities);
      update_data(selected_probs, selected_paths);
    });
    oImg.on('deselected', function() {
      var index = selected_paths.indexOf(image.name);
      selected_paths.splice(index, 1);
      selected_probs.splice(index, 1);
      update_data(selected_probs, selected_paths);
    });
    canvas_ssim.add(oImg);
  });
}

// Configuring the Cnavas Properties
function configureCanvas() {
  // Group Properties
  fabric.Group.prototype.lockScalingX = true;
  fabric.Group.prototype.lockScalingY = true;
  fabric.Group.prototype.lockMovementX = true;
  fabric.Group.prototype.lockMovementY = true;
  fabric.Group.prototype.lockRotation = true;
  fabric.Group.prototype.hasControls = false;
  fabric.Group.prototype.borderColor = 'red';
  // Image Properties
  fabric.Image.prototype.lockScalingX = true;
  fabric.Image.prototype.lockScalingY = true;
  fabric.Image.prototype.lockMovementX = true;
  fabric.Image.prototype.lockMovementY = true;
  fabric.Image.prototype.lockRotation = true;
  fabric.Image.prototype.hasControls = false;
  fabric.Image.prototype.borderColor = 'red';
}
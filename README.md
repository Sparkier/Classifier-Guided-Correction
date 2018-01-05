# Interactive Visualization for Correcting CNN-Image Classification Training Data Errors

The Techniques implemented within this context enable fast identification and correction of errors in training data for CNN image classifiers.

## Usage

The application was implemented for Web usage. Therefore, there is a frontend implementing the visualizations and a backend providing the data.

The frontend uses [node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com).
If you don't have `node` and `npm` installed, follow [this guide](https://nodejs.org/en/download/package-manager/).
For the frontend to load your dataset, the `dataset` variable needs to be modified to the name of your dataset.

The backend runs with `Flask`. 
To make the backend read the data correctly, you have to modify the `data_location` variable in `server.py`.
This variable should contain the path until, but not including, your data folder.

To start the application, first start the backend by simply executing the `server.py`. Then install and start the frontend with `npm install` and `npm start`.

## Data Format

For the application to work, it needs data to visualize. 
The folder containing all the data should be named after your dataset.
All `csv` files are separated by `tab` and not `,`.

First, the images to be displayed need to be present. 
To be loadable, these images need to be split into the folders `test` and `train`.
Within each of these folders, folders with the individual class names should be added.
These folders should then contain your images.

For the application to be able to map the class names, the backend needs a file called `retrained_labels.txt` containing all labels seperated by newlines.

For the similarity measures, a folder named `ssim` should be created. 
This folder should contain a `csv` for each label/classification combination named with the scheme `ssim_0_1.csv`.
The `csv` has a header as follows:
`label class image1 image2 ssim`
The data should then be structured the same way.

To be able to create the visualizations, the application also needs a file called `train_images.csv`.
This file holds all addidtional data.
Its header is as follows:
`image label class percentage name probabilities confirmed distance_grey distance_hue distance_saliency_hue tsne_unprocessed tsne_saliency`
Again, the data should be saved accordingly.

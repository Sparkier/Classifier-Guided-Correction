from flask import Flask, send_file, request
import csv
import os
import re_tsne as rt

app = Flask(__name__)
data_location = '/hdd/Data/Erroneous_Training_Data_Backend/'


def get_labels(dataset):
    with open(data_location + dataset + '/retrained_labels.txt') as f:
        content = f.readlines()
    return ([x.strip() for x in content])


def should_move(dataset, location, label):
    name_split = location.split('/')
    name_split[len(name_split) - 2] = str(label)
    new_location = data_location + dataset
    new_name = ''
    for item in name_split:
        new_name = new_name + item + '/'
    new_name = new_name[:-1]
    new_location = new_location + '/' + new_name
    old_location = data_location + dataset + '/' + location
    if old_location == new_location:
        return location
    else:
        move(old_location, new_location)
        return new_name


def should_delete(confirmed):
    if int(confirmed) == 2:
        return True
    else:
        return False


def move(old_location, new_location):
    os.rename(old_location, new_location)


def remove(dataset, location):
    os.remove(data_location + dataset+'/'+location)


def re_tsne(jsdata, lbl, classification, dataset):
    re_tsne_data = []
    for i in range(0, len(jsdata)):
        current = jsdata[i]
        if (int(current['class']) == int(classification) and
                int(current['label']) == int(lbl) and
                int(current['confirmed']) == 0):
            re_tsne_data.append(current)

    new_vals = []
    if len(re_tsne_data) > 5:
        new_vals = rt.re_tsne(re_tsne_data, dataset)
    return new_vals


@app.route('/train_csv/<dataset>')
def train_csv(dataset):
    return send_file(data_location + dataset + '/train_images.csv',
                     mimetype='text/csv',
                     attachment_filename='train_images.csv',
                     as_attachment=True)


@app.route('/ssim_csv/<dataset>')
def ssim_csv(dataset):
    return send_file(data_location + dataset + '/ssim/ssim.csv',
                     mimetype='text/csv',
                     attachment_filename='train_images.csv',
                     as_attachment=True)


@app.route('/class_ssim_csv/<dataset>/<label>/<clas>')
def class_ssim_csv(dataset, label, clas):
    return send_file(data_location + dataset + '/ssim/ssim_' + str(label) +
                     '_' + str(clas) + '.csv',
                     mimetype='text/csv',
                     attachment_filename='train_images.csv',
                     as_attachment=True)


@app.route('/labels_txt/<dataset>')
def labels_txt(dataset):
    print('test')
    return send_file(data_location + dataset + '/retrained_labels.txt',
                     mimetype='text/txt',
                     attachment_filename='retrained_labels.txt',
                     as_attachment=True)


@app.route('/image/<dataset>/<part>/<label>/<image>')
def image(dataset, part, label, image):
    image_location = (data_location + dataset + '/' + part +
                      '/' + label + '/' + image)
    return send_file(image_location,
                     mimetype='image/jpeg',
                     attachment_filename='image.jpeg',
                     as_attachment=True)


@app.route('/icon/<name>')
def icon(name):
    image_location = 'Icons/' + name
    return send_file(image_location,
                     mimetype='image/jpeg',
                     attachment_filename='image.jpeg',
                     as_attachment=True)


@app.route('/modify_csv/<dataset>/<lbl>/<classification>', methods=['POST'])
def modify_csv(dataset, lbl, classification):
    jsdata = request.get_json()
    new_tsne = re_tsne(jsdata, lbl, classification, (data_location + dataset))
    labels = get_labels(dataset)

    # Write Classification Results into CSV File
    output_file = data_location + dataset + '/train_images.csv'
    test_writer = csv.writer(open(output_file, 'w'), delimiter='\t')
    test_writer.writerow(['image', 'label', 'class', 'percentage', 'name',
                          'probabilities', 'confirmed', 'distance_grey',
                          'distance_hue', 'distance_saliency_hue',
                          'tsne_unprocessed', 'tsne_saliency'])
    image_number = 0
    while image_number < len(jsdata):
        current = jsdata[image_number]
        image = current['image']
        label = current['label']
        clas = current['class']
        percentage = current['percentage']
        name = current['name']
        probabilities = current['probabilities']
        confirmed = current['confirmed']
        distance_grey = current['distance_grey']
        distance_hue = current['distance_hue']
        distance_saliency_hue = current['distance_saliency_hue']
        tsne_unprocessed = current['tsne_unprocessed']
        tsne_saliency = current['tsne_saliency']
        for t in new_tsne:
            if (t[0]['name'] == name):
                tsne_saliency = t[1]
        label_txt = labels[int(label)]
        name = should_move(dataset, name, label_txt)
        test_writer.writerow([image, label, clas, percentage, name,
                              probabilities, confirmed, distance_grey,
                              distance_hue, distance_saliency_hue,
                              tsne_unprocessed, tsne_saliency])
        image_number = image_number + 1
    return ('', 204)


@app.route('/modify_delete/<dataset>/<lbl>/<classification>', methods=['POST'])
def modify_delete(dataset, lbl, classification):
    jsdata = request.get_json()
    new_tsne = re_tsne(jsdata, lbl, classification, (data_location + dataset))

    # Write Classification Results into CSV File
    output_file = data_location + dataset + '/train_images.csv'
    test_writer = csv.writer(open(output_file, 'w'), delimiter='\t')
    test_writer.writerow(['image', 'label', 'class', 'percentage', 'name',
                          'probabilities', 'confirmed', 'distance_grey',
                          'distance_hue', 'distance_saliency_hue',
                          'tsne_unprocessed', 'tsne_saliency'])
    image_number = 0
    while image_number < len(jsdata):
        current = jsdata[image_number]
        image = current['image']
        label = current['label']
        clas = current['class']
        percentage = current['percentage']
        name = current['name']
        probabilities = current['probabilities']
        confirmed = current['confirmed']
        distance_grey = current['distance_grey']
        distance_hue = current['distance_hue']
        distance_saliency_hue = current['distance_saliency_hue']
        tsne_unprocessed = current['tsne_unprocessed']
        tsne_saliency = current['tsne_saliency']
        for t in new_tsne:
            if (t[0]['name'] == name):
                tsne_saliency = t[1]
        if should_delete(confirmed):
            name = remove(dataset, name)
        else:
            test_writer.writerow([image, label, clas, percentage, name,
                                  probabilities, confirmed, distance_grey,
                                  distance_hue, distance_saliency_hue,
                                  tsne_unprocessed, tsne_saliency])
        image_number = image_number + 1
    return ('', 204)


app.run(debug=True)

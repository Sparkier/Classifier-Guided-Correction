from flask import Flask, send_file, request
import csv
import os
import re_tsne as rt
import uuid
from flask import jsonify
from shutil import copyfile, move
import json
import time

app = Flask(__name__)
#data_location = '/hdd/Data/Erroneous_Training_Data_Backend/'
data_location = '/Users/alex/Documents/Studium/NeuralNetworks/'
ok_status = 200
json_type = {'ContentType': 'application/json'}


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
        #move(old_location, new_location)
        return new_name


def should_delete(confirmed):
    if int(confirmed) == 2:
        return True
    else:
        return False


def redo_tsne(new_loc, to_tsne, to_write, label, classification):
    new_vals = []
    if(label != classification):
        if(len(to_tsne) > 5):
            new_vals = rt.re_tsne(to_tsne, new_loc)
    for i in new_vals:
        for j in range(0, len(to_write)):
            if(i[4] == to_write[j][4]):
                to_write[j] = i
    return to_write


@app.route('/train_csv/<dataset>/<participant_id>')
def train_csv(dataset, participant_id):
    new_loc = os.path.join(data_location, dataset, participant_id)
    return send_file(os.path.join(new_loc, 'train_images.csv'),
                     mimetype='text/csv',
                     attachment_filename='train_images.csv',
                     as_attachment=True)


@app.route('/ssim_csv/<dataset>/<participant_id>')
def ssim_csv(dataset, participant_id):
    new_loc = os.path.join(data_location, dataset, participant_id)
    return send_file(os.path.join(new_loc, 'ssim.csv'),
                     mimetype='text/csv',
                     attachment_filename='ssim.csv',
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
    return send_file(data_location + dataset + '/retrained_labels.txt',
                     mimetype='text/txt',
                     attachment_filename='retrained_labels.txt',
                     as_attachment=True)


@app.route('/representative/<dataset>/<label>')
def representative(dataset, label):
    image_location = (data_location + dataset + '/representative/' + label + '.jpg')
    return send_file(image_location,
                     mimetype='image/jpeg',
                     attachment_filename='image.jpeg',
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
    image_location = os.path.join(data_location, 'other', 'icons', name)
    return send_file(image_location,
                     mimetype='image/jpeg',
                     attachment_filename='image.jpeg',
                     as_attachment=True)


@app.route('/relabel_images/<dataset>/<participant_id>/<label>/<classification>', methods=['POST'])
def relabel_images(dataset, participant_id, label, classification):
    paths = request.form.getlist('arr[]')
    to_write = []
    to_tsne = []
    new_loc = os.path.join(data_location, dataset, participant_id)
    readCSV = csv.reader(open(os.path.join(new_loc, 'train_images.csv')), delimiter='\t')
    to_write.append(next(readCSV))
    for row in readCSV:
        if(row[4] in paths):
            row[1] = str(classification)
            row[6] = str(1)
        elif(int(row[1]) == int(label) and int(row[2]) == int(classification)):
            to_tsne.append(row)
        to_write.append(row)
    to_write = redo_tsne(os.path.join(data_location, dataset), to_tsne, to_write, label, classification)
    writeCSV = csv.writer(open(os.path.join(new_loc, 'train_images.csv'), 'w'), delimiter='\t')
    for r in to_write:
        writeCSV.writerow(r)  

    return ('', 204)


@app.route('/confirm_images/<dataset>/<participant_id>/<label>/<classification>', methods=['POST'])
def confirm_images(dataset, participant_id, label, classification):
    paths = request.form.getlist('arr[]')
    to_write = []
    to_tsne = []
    new_loc = os.path.join(data_location, dataset, participant_id)
    readCSV = csv.reader(open(os.path.join(new_loc, 'train_images.csv')), delimiter='\t')
    to_write.append(next(readCSV))
    for row in readCSV:
        if(row[4] in paths):
            row[6] = str(1)
        elif(int(row[1]) == int(label) and int(row[2]) == int(classification)):
            to_tsne.append(row)
        to_write.append(row)
    to_write = redo_tsne(os.path.join(data_location, dataset), to_tsne, to_write, label, classification)
    writeCSV = csv.writer(open(os.path.join(new_loc, 'train_images.csv'), 'w'), delimiter='\t')
    for r in to_write:
        writeCSV.writerow(r)  

    return ('', 204)


@app.route('/delete_images/<dataset>/<participant_id>/<label>/<classification>', methods=['POST'])
def delete_images(dataset, participant_id, label, classification):
    paths = request.form.getlist('arr[]')
    to_write = []
    to_tsne = []
    new_loc = os.path.join(data_location, dataset, participant_id)
    readCSV = csv.reader(open(os.path.join(new_loc, 'train_images.csv')), delimiter='\t')
    to_write.append(next(readCSV))
    for row in readCSV:
        if not(row[4] in paths):
            if(int(row[1]) == int(label) and int(row[2]) == int(classification) and (not (row[4] in paths))):
                to_tsne.append(row)
            to_write.append(row)
    to_write = redo_tsne(os.path.join(data_location, dataset), to_tsne, to_write, label, classification)
    writeCSV = csv.writer(open(os.path.join(new_loc, 'train_images.csv'), 'w'), delimiter='\t')
    for r in to_write:
        writeCSV.writerow(r)  

    readCSV = csv.reader(open(os.path.join(new_loc, 'ssim.csv')), delimiter='\t')
    to_write = []
    to_write.append(next(readCSV))
    for row in readCSV:
        if(int(row[0]) == int(label) and int(row[1]) == int(classification)):
            row[2] = str(0.5)
            row[3] = str(0.5)
        to_write.append(row)

    writeCSV = csv.writer(open(os.path.join(new_loc, 'ssim.csv'), 'w'), delimiter='\t')
    for r in to_write:
        writeCSV.writerow(r)
    
    return ('', 204)


@app.route('/participant_id/<dataset>', methods=['GET'])
def gen_participant_id(dataset):
    new_participant_id = str(uuid.uuid4())
    new_loc = os.path.join(data_location, dataset, new_participant_id)
    if not os.path.exists(new_loc):
        os.makedirs(new_loc)
    copyfile(os.path.join(data_location, dataset, 'train_images.csv'), 
            os.path.join(new_loc, 'train_images.csv'))
    copyfile(os.path.join(data_location, dataset, 'ssim/ssim.csv'), 
        os.path.join(new_loc, 'ssim.csv'))    
    return jsonify({'participant_id': new_participant_id})


@app.route('/client_information/<dataset>/<participant_id>', methods=['PUT'])
def client_info(dataset, participant_id):
    doc = request.get_json(silent=True)
    with open(os.path.join(data_location, dataset, participant_id, 'client_info.json'), 'w') as outfile:
        json.dump(doc, outfile)
    result = jsonify({'success': True})
    return result, ok_status, json_type


@app.route('/demographics_survey/', methods=['GET'])
def demographics_survey():
    with open('demographics.json') as json_data:
        d = json.load(json_data)
        return jsonify(d)


@app.route('/client_demographics/<dataset>/<participant_id>', methods=['PUT'])
def client_demographics(dataset, participant_id):
    doc = request.get_json(silent=True)
    
    with open(os.path.join(data_location, dataset, participant_id, 'client_demographics.json'), 
        'w') as outfile:
        json.dump(doc, outfile)

    result = jsonify({'success': True})
    return result, ok_status, json_type


@app.route('/survey/', methods=['GET'])
def survey():
    with open('survey.json') as json_data:
        d = json.load(json_data)
        return jsonify(d)


@app.route('/client_survey/<dataset>/<participant_id>', methods=['PUT'])
def client_survey(dataset, participant_id):
    doc = request.get_json(silent=True)
    
    with open(os.path.join(data_location, dataset, participant_id, 'client_survey.json'), 
        'w') as outfile:
        json.dump(doc, outfile)

    result = jsonify({'success': True})
    return result, ok_status, json_type


@app.route('/deconfusion_start/<dataset>/<participant_id>', methods=['GET'])
def deconfusion_start(dataset, participant_id):
    new_loc = os.path.join(data_location, dataset, participant_id)
    file = open(os.path.join(new_loc, 'starttime.txt'),'w') 
    file.write(str(time.time())) 
    file.close()
    return ('', 204)


@app.route('/deconfusion_end/<dataset>/<participant_id>', methods=['GET'])
def deconfusion_end(dataset, participant_id):
    new_loc = os.path.join(data_location, dataset, participant_id)
    file = open(os.path.join(new_loc, 'endtime.txt'),'w') 
    file.write(str(time.time()))
    file.close()
    print('hallo')
    return ('', 204)


@app.route('/explain_images/<name>')
def explain_image(name):
    image_location = os.path.join(data_location, 'other', 'explain_images', name)
    return send_file(image_location,
                     mimetype='image/jpeg',
                     attachment_filename='image.jpeg',
                     as_attachment=True)


app.run(debug=True)

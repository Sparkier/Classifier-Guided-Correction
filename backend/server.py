from flask import Flask, send_file, request
import csv
import os
import re_tsne as rt
import uuid
from flask import jsonify
from shutil import copyfile, move
import json
import time
import datetime

app = Flask(__name__)
#data_location = '/hdd/Data/Erroneous_Training_Data_Backend/'
data_location = '/Users/alex/Documents/Studium/NeuralNetworks/'
ok_status = 200
json_type = {'ContentType': 'application/json'}

###################
# Helper functions.
###################
# Redo the tSNE when images change.
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


###########################################
# Basic Serving independant of participant.
###########################################
# Get an icon.
@app.route('/icon/<name>')
def icon(name):
    image_location = os.path.join(data_location, 'other', 'icons', name)
    return send_file(image_location,
                     mimetype='image/jpeg',
                     attachment_filename='image.jpeg',
                     as_attachment=True)


# Get the demographics survey.
@app.route('/demographics_survey/', methods=['GET'])
def demographics_survey():
    with open('demographics.json') as json_data:
        d = json.load(json_data)
        return jsonify(d)


# Get the final survey.
@app.route('/survey/', methods=['GET'])
def survey():
    with open('survey.json') as json_data:
        d = json.load(json_data)
        return jsonify(d)


# Get the labels file for a specific dataset.
@app.route('/labels_txt/<dataset>')
def labels_txt(dataset):
    return send_file(data_location + dataset + '/retrained_labels.txt',
                     mimetype='text/txt',
                     attachment_filename='retrained_labels.txt',
                     as_attachment=True)


# Get one of the explain images.
@app.route('/explain_images/<name>')
def explain_image(name):
    image_location = os.path.join(data_location, 'other', 'explain_images', name)
    return send_file(image_location,
                     mimetype='image/jpeg',
                     attachment_filename='image.jpeg',
                     as_attachment=True)


# Get a representative for a dataset and a specific label.
@app.route('/representative/<dataset>/<label>')
def representative(dataset, label):
    image_location = (data_location + dataset + '/representative/' + label + '.jpg')
    return send_file(image_location,
                     mimetype='image/jpeg',
                     attachment_filename='image.jpeg',
                     as_attachment=True)


# Get the similarity results per cell for a specific dataset.
@app.route('/class_ssim_csv/<dataset>/<label>/<clas>')
def class_ssim_csv(dataset, label, clas):
    return send_file(data_location + dataset + '/ssim/ssim_' + str(label) +
                     '_' + str(clas) + '.csv',
                     mimetype='text/csv',
                     attachment_filename='train_images.csv',
                     as_attachment=True)


# Get an image from a dataset.
@app.route('/image/<dataset>/<part>/<label>/<image>')
def image(dataset, part, label, image):
    image_location = (data_location + dataset + '/' + part +
                      '/' + label + '/' + image)
    return send_file(image_location,
                     mimetype='image/jpeg',
                     attachment_filename='image.jpeg',
                     as_attachment=True)


################################
# Participant dependant serving.
################################
# Get a new paricipant id.
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


# Save the client information.
@app.route('/client_information/<dataset>/<participant_id>', methods=['PUT'])
def client_info(dataset, participant_id):
    doc = request.get_json(silent=True)
    with open(os.path.join(data_location, dataset, participant_id, 'client_info.json'), 'w') as outfile:
        json.dump(doc, outfile)
    result = jsonify({'success': True})
    return result, ok_status, json_type


# Save the results of the demographics survey.
@app.route('/client_demographics/<dataset>/<participant_id>', methods=['PUT'])
def client_demographics(dataset, participant_id):
    doc = request.get_json(silent=True)
    
    with open(os.path.join(data_location, dataset, participant_id, 'client_demographics.json'), 
        'w') as outfile:
        json.dump(doc, outfile)

    result = jsonify({'success': True})
    return result, ok_status, json_type


# Save the results of the final survey.
@app.route('/client_survey/<dataset>/<participant_id>', methods=['PUT'])
def client_survey(dataset, participant_id):
    doc = request.get_json(silent=True)
    with open(os.path.join(data_location, dataset, participant_id, 'client_survey.json'), 
        'w') as outfile:
        json.dump(doc, outfile)
    result = jsonify({'success': True})
    return result, ok_status, json_type

# Save the endtime of deconfusion.
@app.route('/deconfusion_end/<dataset>/<participant_id>', methods=['GET'])
def deconfusion_end(dataset, participant_id):
    new_loc = os.path.join(data_location, dataset, participant_id)
    if not (os.path.exists(os.path.join(new_loc, 'endtime.txt'))):
        file = open(os.path.join(new_loc, 'endtime.txt'),'w') 
        file.write(str(datetime.datetime.now()))
        file.close()
    return ('', 204)


# Check if time has expired.
@app.route('/time_exceeded/<dataset>/<participant_id>', methods=['GET'])
def time_exceeded(dataset, participant_id):
    new_loc = os.path.join(data_location, dataset, participant_id)
    result = jsonify({'exceeded': False})
    if not (os.path.exists(os.path.join(new_loc, 'starttime.txt'))):
        file = open(os.path.join(new_loc, 'starttime.txt'),'w') 
        file.write(str(datetime.datetime.now())) 
        file.close()
    file = open(os.path.join(new_loc, 'starttime.txt'), 'r')
    time_string = file.read()
    file.close()    
    datetime_old = datetime.datetime.strptime(time_string, "%Y-%m-%d %H:%M:%S.%f")
    datetime_new = datetime.datetime.now()
    difference = datetime_new - datetime_old
    if(datetime.timedelta(minutes=15) < difference):
        result = jsonify({'exceeded': True})
    return result, ok_status, json_type


# Get the training results for a specific dataset per participant.
@app.route('/train_csv/<dataset>/<participant_id>')
def train_csv(dataset, participant_id):
    new_loc = os.path.join(data_location, dataset, participant_id)
    return send_file(os.path.join(new_loc, 'train_images.csv'),
                     mimetype='text/csv',
                     attachment_filename='train_images.csv',
                     as_attachment=True)


# Get the overall similarity results for a specific dataset per participant.
@app.route('/ssim_csv/<dataset>/<participant_id>')
def ssim_csv(dataset, participant_id):
    new_loc = os.path.join(data_location, dataset, participant_id)
    return send_file(os.path.join(new_loc, 'ssim.csv'),
                     mimetype='text/csv',
                     attachment_filename='ssim.csv',
                     as_attachment=True)


# Relabel selected images in a dataset for a participant.
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


# Confirm selected images in a dataset for a participant.
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


# Delete selected images in a dataset for a participant.
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

app.run(debug=True)

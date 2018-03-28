import trainclass from './trainclass';
import confusionmatrix from './confusionmatrix';
import detailview from './detailview';
import demographics from './demographics';
import survey_final from './survey';
import video from './video'
import images_explanation from './images_explanation';
import $ from 'jquery';
import * as browserStore from 'storejs';
import 'clientjs';

$(() => {
    const client = new ClientJS();
    var dataset = 'cifar10_test';
    var location = window.location.href.toString().split(window.location.host)[1];
    var participant_id = browserStore.get('participant_id');

    if(participant_id === undefined) {
        $.ajax({
            method: 'GET',
            url: '/api/participant_id/' + dataset
        }).done((data) => {
            participant_id = data.participant_id;
            browserStore.set('participant_id', data.participant_id);
            storeBrowserInfo(data.participant_id);
        });
    } else {
        dispatch();
    }

    const storeBrowserInfo = (id) => {
        const browserInfo = client.getBrowserData();
        const fingerprint = client.getFingerprint();
        $.ajax({
            method: 'PUT',
            url: '/api/client_information/' + dataset + '/' + id,
            data: JSON.stringify({
                participant_id: id,
                browserInfo,
                fingerprint
            }),
            contentType: 'application/json'
        }).done(() => {
            dispatch();
        });
    };    
    
    function dispatch() {
        if (client.isMobile()) {
            window.location.href = "mobile.html";
        } 
        if (location == '/demographics.html') {
            demographics(dataset);
        } else if (location == '/images_explanation.html'){
            images_explanation(dataset);
        } else if (location == '/video1.html'){
            video(dataset, 0);
        } else if (location == '/confusion.html') {
            $.ajax({
                method: 'GET',
                url: '/api/time_exceeded/' + dataset + '/' + participant_id
            }).done((data) => {
                if(data.exceeded == true) {
                    window.location.href = "survey.html";
                }
            });
            confusionmatrix(dataset);
        } else if (location == '/video2.html'){
            video(dataset, 1);
        } else if (location == '/survey.html') {
            $.ajax({
                method: 'GET',
                url: '/api/deconfusion_end/' + dataset + '/' + participant_id
            });
            survey_final(dataset);
        } else if (location == '/mobile.html'){
        } else {
            var label = findGetParameter('label');
            var classification = findGetParameter('class');
            trainclass(dataset, label, classification);
            detailview(dataset, label, classification);
        }
    }

    function findGetParameter(parameterName) {
        var result = null,
            tmp = [];
        window.location.search
            .substr(1)
            .split("&")
            .forEach(function(item) {
                tmp = item.split("=");
                if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
            });
        return result;
    }
});

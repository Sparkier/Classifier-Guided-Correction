import trainclass from './trainclass';
import confusionmatrix from './confusionmatrix';
import detailview from './detailview';
import demographics from './demographics'
import survey from './survey'
import $ from 'jquery';
import * as browserStore from 'storejs';
import 'clientjs';

$(() => {
    const client = new ClientJS();
    var dataset = 'cifar10_test';
    var location = window.location.href.toString().split(window.location.host)[1];
    const participant_id = browserStore.get('participant_id');

    if(participant_id === undefined) {
        $.ajax({
            method: 'GET',
            url: '/api/participant_id/' + dataset
        }).done((data) => {
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
        if (location == '/demographics.html') {
            demographics(dataset);
        } else if (location == '/confusion.html') {
            setTimeout(function () {
                window.location.href = "survey.html"; //will redirect to your blog page (an ex: blog.html)
            }, 900000); //will call the function after 2 secs.
            confusionmatrix(dataset);
        } else if (location == '/survey.html') {
            survey(dataset);
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

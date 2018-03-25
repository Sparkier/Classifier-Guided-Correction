import $ from 'jquery';
import * as browserStore from 'storejs';

export default function images_explanation(dataset) {   
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

    var next = document.getElementById('nextButton');
    next.onclick = function() {
        complete();
    }

    function dispatch() {
        var img = document.createElement("img");
        img.src = "http://www.google.com/intl/en_com/images/logo_plain.png";

        var src = document.getElementById("imageElement");
        src.appendChild(img);
    }

    function complete() {
        window.location.href = "confusion.html";
    }
}
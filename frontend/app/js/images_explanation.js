import $ from 'jquery';
import * as browserStore from 'storejs';

export default function images_explanation(dataset) { 
    var images = ['dogcat_correct.jpg', 'mnist_correct.jpg', 'mnist_false.jpg'];
    var i = 0;

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
        if (i < (images.length - 1)) {
            i++;
            var img = document.getElementById("explainImage");
            img.src = 'api/explain_images/' + images[i];
        } else {
            complete();
        }
    }

    var previous = document.getElementById('previousButton');
    previous.onclick = function() {
        if (i > 0){
            i--;
            var img = document.getElementById("explainImage");
            img.src = 'api/explain_images/' + images[i];
        }
    }

    function dispatch() {
        var img = document.getElementById("explainImage");
        img.src = 'api/explain_images/' + images[i];
    }

    function complete() {
        window.location.href = "video.html";
    }
}